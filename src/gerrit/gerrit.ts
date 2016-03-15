import { Ref } from "./ref";
import { createLog, GitLog } from "./gitLog";
import { Logger, LoggerSingleton } from "../view/logger";
import { GerritSettings } from "../common/settings";
import { StatusBar } from "../view/statusbar";
import { workspace } from "vscode";
import * as common from "../common/common";
import * as utils from "../common/utils";
import * as exec from "../common/exec";
import { IReview } from "./gerritAPI";
import Event from "../common/event";
let rp = require("request-promise");

export class Gerrit {
    private branch: string;
    private currentRef: Ref;
    private logger: LoggerSingleton;
    private settings: GerritSettings;
    private statusBar: StatusBar;
    private cherrypickActive: boolean;
    private rebaseActive: boolean;

    constructor(private workspaceRoot: string, private repo: string, ref?: Ref) {
        this.settings = new GerritSettings();
        this.logger = Logger.logger;
        this.logger.setDebug(true);
        this.logger.log("Activating Gerrit...", false);
        this.cherrypickActive = false;
        this.rebaseActive = false;
        if (ref !== null) {
            this.getGitLog(0).then(value => {
                console.log(value);
                if (value.change_id !== null) {
                    this.get(`changes/${value.change_id}/revisions/${value.commit}/review`).then((value: IReview) => {
                        this.settings.project = value.project;
                        this.setBranch(value.branch);
                        // TODO: handle case when merged adn ref does not exist
                        let ref: Ref = new Ref(value._number, value.revisions[value.current_revision]._number);
                        this.setCurrentRef(ref);
                    });
                }
            }, (reason: common.RejectReason) => {
                if (reason.attributes.stderr.indexOf("does not have any commits yet") > -1) {
                    this.logger.log("No commits on branch");
                }
            });
            // TODO: determine ref at start
            this.currentRef = ref;
        }
    }

    public setStatusBar(statusBar: StatusBar) {
        this.statusBar = statusBar;
    }

    public getCurrentRef(): Ref {
        return this.currentRef;
    }

    public setBranch(branch: string) {
        this.branch = branch;
        Event.emit("branch.change", this.statusBar, branch);
    }

    public getBranch(): string {
        return this.branch;
    }

    private setCurrentRef(ref: Ref) {
        this.currentRef = ref;
        Event.emit("ref.change", this.statusBar, ref);
        this.logger.debug(`New Ref:
    ID: ${this.currentRef.getId()}
    Patch Set: ${this.currentRef.getPatchSet()}`);
    }

    private isDirty(): Promise<boolean> {
        return this.getDirtyFiles().then(value => {
            return value.isDirty();
        });
    }

    public getDirtyFiles(): Promise<common.DirtyFileContainter> {
        let options = [
            "--exclude-standard"
        ];
        let dirtyTypes = {
            deleted: "-d",
            modified: "-m",
            untracked: "-o"
        };
        let container = new common.DirtyFileContainter();
        return this.git("ls-files", options.concat([dirtyTypes.deleted])).then(result => {
            let files: string[] = result.split(utils.SPLIT_LINE).filter(utils.filterDuplicates);
            for (let i in files) {
                container.addDeleted({
                    path: files[i]
                });
            }
            return this.git("ls-files", options.concat([dirtyTypes.modified]));
        }).then(result => {
            let files: string[] = result.split(utils.SPLIT_LINE).filter(utils.filterDuplicates);
            for (let i in files) {
                container.addModified({
                    path: files[i]
                });
            }
            return this.git("ls-files", options.concat([dirtyTypes.untracked]));
        }).then(result => {
            let files: string[] = result.split(utils.SPLIT_LINE).filter(utils.filterDuplicates);
            for (let i in files) {
                container.addUntrackedFile({
                    path: files[i]
                });
            }
            return container;
        });
    }

    public getStagedFiles(): Promise<common.StagedFileContainter> {
        let options = [
            "--name-only",
            "--cached"
        ];
        let container = new common.StagedFileContainter();
        return this.git("diff", options).then(result => {
            let files: string[] = result.split(utils.SPLIT_LINE).filter(utils.filterDuplicates);
            for (let i in files) {
                container.addStaged({
                    path: files[i]
                });
            }
            return container;
        });
    }

    public getBranches(): Promise<string[]> {
        return this.get(`projects/${this.settings.project}/branches/`).then(value => {
            if (utils.isNull(value)) {
                return [(utils.isNull(this.getBranch())) ? "master" : this.getBranch()];
            }
            let branches: string[] = [];
            for (let head of value) {
                if (head["ref"].indexOf("refs/heads/") > -1) {
                    branches.push(head["ref"].replace("refs/heads/", ""));
                }
            }
            // Return branches if set, or this.branch or master if all other are null
            return (branches.length > 0) ? branches : [(utils.isNull(this.getBranch())) ? "master" : this.getBranch()];
        });
    }

    public getChanges(count?: number): Promise<common.ChangeQuickPick[]> {
        let countString = (utils.isNull(count)) ? "" : "&n=" + count;
        return this.get(`changes/?q=status:open+project:${this.settings.project}${countString}`).then(value => {
            let changes: common.ChangeQuickPick[] = [];
            for (let item of value) {
                let change: common.ChangeQuickPick = {
                    change_id: item.change_id,
                    change_number: item._number,
                    label: item._number.toString(),
                    description: item.subject
                };
                changes.push(change);
            }
            return changes;
        });
    }

    getPachsets(change_id: number): Promise<string[]> {
        return this.get(`changes/?q=${change_id}&o=CURRENT_REVISION`).then((value: IReview) => {
            let revision_count: number = value.revisions[value.current_revision]._number;
            let revisions: string[] = [];
            for (let i = 0; i < revision_count; i++) {
                revisions.push(i.toString());
            }
            return revisions;
        });
    }

    public stage(path: string): Promise<string> {
        this.logger.debug(`Stage:
    Message: ${path}`);
        let args = [
            path
        ];
        return this.git("add", [], args);
    }

    public reset(path: string, hard?: boolean): Promise<string> {
        hard = utils.setDefault(hard, false);
        this.logger.debug(`Stage:
    Message: ${path}`);
        let args: string[] = [
            path
        ];
        let options: string[] = [];
        if (hard) {
            options.push("--hard");
        }
        return this.git("reset", options, args);
    }

    public clean(path: string): Promise<string> {
        return this.checkout(path);
    }

    public commit(msg: string, amend: boolean): Promise<string> {
        this.logger.debug(`Commit:
    Message: ${msg}
    Amend: ${amend}`);
        return new Promise((resolve, reject) => {
            let options: string[] = [];
            if (amend) {
                options.push("--amend", "--no-edit");
            } else {
                if (msg === null || msg.length === 0) {
                    let reason: common.RejectReason = {
                        showInformation: true,
                        message: "Requires a message to commit with",
                        type: common.RejectType.DEFAULT
                    };
                    reject(reason);
                }
                options.push("--file", "-");
            }
            this.git("commit", options, [], (!amend) ? msg : null).then(value => {
                resolve(value);
            }, reason => {
                reject(reason);
            });
        });
    }

    // TODO: get branch list??
    public checkoutBranch(branch: string): Promise<string> {
        this.logger.debug(`Checkout Branch:
    Branch: origin/${branch}`);
        return this.fetch("", ["-fv"]).then(fetchValue => {
            return this.checkout(`origin/${branch}`).then(checkoutValue => {
                this.setBranch(branch);
                return checkoutValue;
            });
        });
    }

    public checkoutRef(ref: Ref): Promise<string> {
        this.logger.debug(`Checkout Ref:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return this.fetchRef(ref, this.checkout);
    }

    public cherrypickRef(ref: Ref): Promise<string> {
        this.logger.debug(`Cherrypick Ref:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return this.fetchRef(ref, this.cherrypick);
    }

    private fetchRef<T>(ref: Ref, resolver: (url: string) => Promise<string>): Promise<string> {
        return new Promise((resolve, reject) => {
            this.isDirty().then(dirty => {
                if (dirty) {
                    let reason: common.RejectReason = {
                        showInformation: true,
                        message: "Dirty Head",
                        type: common.RejectType.DEFAULT
                    };
                    reject(reason);
                    return;
                }

                this.setCurrentRef(ref);

                this.fetch(ref.getUrl()).then(value => {
                    resolver.apply(this, ["FETCH_HEAD"]).then(value => {
                        resolve(value);
                    }, reason => {
                        reject(reason);
                        return;
                    });
                }, reason => {
                    reject(reason);
                    return;
                });
            }, reason => {
                reject(reason);
                return;
            });
        });
    }

    private fetch(url: string, options?: string[]): Promise<string> {
        url = utils.setDefault(url, "");
        options = utils.setDefault(options, []);
        let args: string[] = [
            "origin"
        ];
        if (url.length > 0) {
            args.push(url);
        }
        return this.git("fetch", options, args);
    }

    private checkout(HEAD: string): Promise<string> {
        let options = [
            HEAD
        ];
        return this.git("checkout", options);
    }

    private cherrypick(HEAD: string): Promise<string> {
        let options = [
            HEAD
        ];
        return this.git("cherry-pick", options).then(value => {
            return value;
        }, reason => {
            this.cherrypickActive = true;
            return reason;
        });
    }

    public cherrypickContinue(): Promise<string> {
        if (!this.cherrypickActive) {
            return;
        }
        let options = [
            "--continue"
        ];
        return this.git("cherry-pick", options).then(value => {
            this.cherrypickActive = false;
            return value;
        });
    }

    public push(branch: string): Promise<string> {
        let args = [
            "origin",
            `HEAD:refs/for/${branch}`
        ];
        return this.git("push", [], args).then(value => {
            this.setBranch(branch);
            return value;
        });
    }

    // TODO: check how rejections are passed through
    public rebase(branch: string): Promise<string> {
        this.logger.debug(`Rebase Branch:
    Branch: origin/${branch}`);
        return this.fetch("", ["-fv"]).then(value => {
            let args: string[] = [
                `origin/${branch}`
            ];
            return this.git("rebase", [], args).then(value => {
                this.setBranch(branch);
                return value;
            }, reason => {
                this.rebaseActive = true;
                return reason;
            });
        });
    }

    public rebaseContinue(): Promise<string> {
        if (!this.rebaseActive) {
            return;
        }
        let options = [
            "--continue"
        ];
        return this.git("rebase", options).then(value => {
            this.rebaseActive = false;
            return value;
        });
    }

    private getGitLog(index: number): Promise<GitLog> {
        let options = [
            "--skip",
            index.toString(),
            "-n",
            "1"
        ];
        return this.git("log", options).then(value => {
            return createLog(value);
        });
    }

    private git(gitCommand: string, options?: string[], args?: string[], stdin?: string): Promise<string> {
        options = utils.setDefault(options, []);
        args = utils.setDefault(args, []);
        stdin = utils.setDefault(stdin, "");
        return new Promise((resolve, reject) => {
            let fullArgs: string[] = [gitCommand];
            fullArgs = fullArgs.concat(options);
            fullArgs.push("--");
            fullArgs = fullArgs.concat(args);
            this.logger.log(fullArgs.join(" "));

            let runOptions = {
                cwd: this.workspaceRoot,
            };
            if (stdin.length > 0) {
                runOptions["input"] = stdin + "\n";
            }

            let child = exec.run("git", fullArgs, runOptions).then(result => {
                if (result.error === null) {
                    resolve(result.stdout);
                } else {
                    let reason: common.RejectReason = {
                        showInformation: false,
                        message: "Failed Git",
                        type: common.RejectType.GIT,
                        attributes: { error: result.error, stderr: result.stderr }
                    };
                    console.warn(reason);
                    this.logger.log(result.error.name);
                    reject(reason);
                    return;
                }
            });
        });
    }

    private generateFetchUrl(): string {
        if (["http", "ssh"].indexOf(this.settings.protocol) === -1) {
            this.logger.log("Incorrect protocol specified");
            this.logger.log("Must be http or ssh");
            throw new Error("Incorrect protocol specified");
        }
        return `${this.settings.protocol}://${this.settings.host}:${(this.settings.protocol === "http")
            ? this.settings.httpPort : this.settings.sshPort}/${this.settings.project}`;
    }

    // TODO: implement rest api interfaces and type the return
    private get(path: string): Promise<any> {
        let url = `http://${this.settings.host}:${this.settings.httpPort}/a/${path}`;
        console.log(url);
        let options = {
            url: url,
            auth: {
                user: this.settings.username,
                pass: this.settings.httpPassword,
                sendImmediately: false
            }
        };
        return rp(options).then(value => {
            return JSON.parse(value.replace(")]}'\n", ""));
        }, reason => {
            console.log(reason);
        });
    }
}
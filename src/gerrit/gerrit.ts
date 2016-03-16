import { Ref } from "./ref";
import { createLog, GitLog } from "./gitLog";
import { Logger, LoggerSingleton } from "../view/logger";
import { GerritSettings, IGerritSettings } from "../common/settings";
import { StatusBar } from "../view/statusbar";
import { workspace } from "vscode";
import * as common from "../common/common";
import * as utils from "../common/utils";
import * as exec from "../common/exec";
import { IReview } from "./gerritAPI";
import Event from "../common/event";
import { Git, IGit } from "./git";
import * as files from "./files";
let rp = require("request-promise");

// TODO: Redo FileContainer and add event emitter

interface IGerrit {
    setStatusBar(statusBar: StatusBar): void;
    getCurrentRef(): Ref;
    setBranch(branch: string): void;
    getBranch(): string;
    setCurrentRef(ref: Ref): void;
    isDirty(): Promise<boolean>;
    getDirtyFiles(): Promise<files.DirtyFileContainter>;
    getStagedFiles(): Promise<files.StagedFileContainter>;
    getBranches(): Promise<string[]>;
    getChanges(count?: number): Promise<common.ChangeQuickPick[]>;
    getPatchsets(change_id: number): Promise<common.PatchsetQuickPick[]>;
    checkoutBranch(branch: string): Promise<string>;
    checkoutRef(ref: Ref): Promise<string>;
    cherrypickRef(ref: Ref): Promise<string>;
    push(branch: string): Promise<string>;
    rebase(branch: string): Promise<string>;
}

class GerritClass implements IGerrit {
    private branch: string;
    private currentRef: Ref;
    private logger: LoggerSingleton;
    private settings: IGerritSettings;
    private statusBar: StatusBar;
    private git: IGit;

    constructor(ref?: Ref) {
        this.settings = GerritSettings;
        this.logger = Logger.logger;
        this.logger.setDebug(true);
        this.logger.log("Activating Gerrit...", false);
        this.git = Git;
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

    public setCurrentRef(ref: Ref) {
        this.currentRef = ref;
        Event.emit("ref.change", this.statusBar, ref);
        this.logger.debug(`New Ref:
    ID: ${this.currentRef.getId()}
    Patch Set: ${this.currentRef.getPatchSet()}`);
    }

    public isDirty(): Promise<boolean> {
        return this.getDirtyFiles().then(value => {
            return value.isDirty();
        });
    }

    public getDirtyFiles(): Promise<files.DirtyFileContainter> {
        let options = [
            "--exclude-standard"
        ];
        let dirtyTypes = {
            deleted: "-d",
            modified: "-m",
            untracked: "-o"
        };
        let container = new files.DirtyFileContainter();
        return this.git.git("ls-files", options.concat([dirtyTypes.deleted])).then(result => {
            let files: string[] = result.split(utils.SPLIT_LINE).filter(utils.filterDuplicates);
            for (let i in files) {
                container.addDeleted({
                    path: files[i]
                });
            }
            return this.git.git("ls-files", options.concat([dirtyTypes.modified]));
        }).then(result => {
            let files: string[] = result.split(utils.SPLIT_LINE).filter(utils.filterDuplicates);
            for (let i in files) {
                container.addModified({
                    path: files[i]
                });
            }
            return this.git.git("ls-files", options.concat([dirtyTypes.untracked]));
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

    public getStagedFiles(): Promise<files.StagedFileContainter> {
        let options = [
            "--name-only",
            "--cached"
        ];
        let container = new files.StagedFileContainter();
        return this.git.git("diff", options).then(result => {
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

    public getPatchsets(change_id: number): Promise<common.PatchsetQuickPick[]> {
        return this.get(`changes/?q=${change_id}&o=CURRENT_REVISION`).then((value: IReview) => {
            let revision_count: number = value[0].revisions[value[0].current_revision]._number;
            let revisions: common.PatchsetQuickPick[] = [];
            for (let i = revision_count; i >= 1; i--) {
                revisions.push({
                    patchset: i,
                    label: i.toString(),
                    description: ""
                });
            }
            return revisions;
        });
    }

    public checkoutBranch(branch: string): Promise<string> {
        this.logger.debug(`Checkout Branch:
    Branch: origin/${branch}`);
        return this.git.fetch("", ["-fv"]).then(fetchValue => {
            return this.git.checkout(`origin/${branch}`).then(checkoutValue => {
                this.setBranch(branch);
                return checkoutValue;
            });
        });
    }

    public checkoutRef(ref: Ref): Promise<string> {
        this.logger.debug(`Checkout Ref:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return this.fetchRef(ref, this.git.checkout);
    }

    public cherrypickRef(ref: Ref): Promise<string> {
        this.logger.debug(`Cherrypick Ref:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return this.fetchRef(ref, this.git.cherrypick);
    }

    private fetchRef<T>(ref: Ref, resolver: (url: string) => Promise<string>): Promise<string> {
        return this.isDirty().then(dirty => {
            if (dirty) {
                let reason: common.RejectReason = {
                    showInformation: true,
                    message: "Dirty Head",
                    type: common.RejectType.DEFAULT
                };
                Promise.reject(reason);
                return;
            }

            this.setCurrentRef(ref);

            return this.git.fetch(ref.getUrl()).then(value => {
                return resolver.apply(this.git, ["FETCH_HEAD"]);
            });
        });
    }

    private fetch(url: string, options?: string[]): Promise<string> {
        url = utils.setDefault(url, "");
        options = utils.setDefault(options, []);
        return this.git.fetch(url, options);
    }

    private cherrypick(HEAD: string): Promise<string> {
        return this.git.cherrypick(HEAD);
    }

    public cherrypickContinue(): Promise<string> {
        return this.git.cherrypickContinue();
    }

    public push(branch: string): Promise<string> {
        let target = [
            `HEAD:refs/for/${branch}`
        ];
        return this.git.push(target).then(value => {
            this.setBranch(branch);
            return value;
        });
    }

    // TODO: check how rejections are passed through
    public rebase(branch: string): Promise<string> {
        this.logger.debug(`Rebase Branch:
    Branch: origin/${branch}`);
        return this.fetch("", ["-fv"]).then(value => {
            let target: string = `origin/${branch}`;
            return this.git.rebase(target).then(value => {
                this.setBranch(branch);
                return value;
            });
        });
    }

    private getGitLog(index: number): Promise<GitLog> {
        return this.git.getGitLog(index);
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

class GerritSingleton {
    private static _gerrit: GerritClass = null;

    static get gerrit() {
        if (utils.isNull(GerritSingleton._gerrit)) {
            GerritSingleton._gerrit = new GerritClass();
        }
        return GerritSingleton._gerrit;
    }
}

const Gerrit = GerritSingleton.gerrit;
export default Gerrit;
export { Gerrit, IGerrit };

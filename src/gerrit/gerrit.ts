import * as rp from "request-promise";
import { workspace } from "vscode";
import { IReview } from "./gerritAPI";
import { Ref } from "./ref";
import Event from "../common/event";
import * as exec from "../common/exec";
import * as gitCommon from "../git/common";
import { Git } from "../git/git";
import { createLog, GitLog } from "../git/gitLog";
import * as reject from "../common/reject";
import { Settings } from "../common/settings";
import * as utils from "../common/utils";
import { FileContainer } from "../files/fileContainer";
import { FileServiceClient } from "../files/fileServiceClient";
import { RequestEventType } from "../files/fileServiceInterface";
import * as view from "../view/common";
import { Logger } from "../view/logger";
import { StatusBar } from "../view/statusbar";

// TODO: Contains serious regression in running on Tempest
export class Gerrit {
    private branch: string;
    private currentRef: Ref;
    private logger: Logger;
    private settings: Settings;
    private statusBar: StatusBar;
    private git: Git;
    private fileIndex: FileServiceClient;
    private static _gerrit: Gerrit = null;

    constructor() {
        this.settings = Settings.getInstance();
        this.logger = Logger.logger;
        this.logger.setDebug(true);
        this.logger.log("Activating Gerrit...", false);
        this.git = Git.getInstance();
        this.fileIndex = FileServiceClient.getInstance();
        Event.on("server-ready", Gerrit.handleUpdate);
        Event.on("update-head", Gerrit.handleUpdate);
    }

    static getInstance() {
        if (utils.isNull(Gerrit._gerrit)) {
            Gerrit._gerrit = new Gerrit();
        }
        return Gerrit._gerrit;
    }

    static handleUpdate() {
        Gerrit.getInstance().updateStatus();
    }

    private updateStatus() {
        this.fileIndex.updateFiles();
        this.getGitLog(0).then(value => {
            console.log(value);
            if (!utils.isNull(value) && !utils.isNull(value.change_id)) {
                this.get(`changes/${value.change_id}/revisions/${value.commit}/review`).then((value: IReview) => {
                    this.settings.project = value.project;
                    this.setBranch(value.branch);
                    let ref: Ref = new Ref(value._number, value.revisions[value.current_revision]._number);
                    this.setCurrentRef(ref);
                }, reason => {
                    console.log("rejected");
                    console.log(reason);
                });
            }
        }, (reason: reject.RejectReason) => {
            console.log("rejected");
            console.log(reason);
            if (!utils.isNull(reason.attributes) && reason.attributes.stderr.indexOf("does not have any commits yet") > -1) {
                this.logger.log("No commits on branch");
            }
        });
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

    public isDirty(): PromiseLike<boolean> {
        return this.getDirtyFiles().then(value => (value.length > 0));
    }

    public getDirtyFiles(): PromiseLike<view.FileStageQuickPick[]> {
        return this.fileIndex.updateFiles().then(() =>
            this.fileIndex.getDescriptorsByType([gitCommon.GitStatus.DELETED,
                gitCommon.GitStatus.MODIFIED,
                gitCommon.GitStatus.UNTRACKED])
        );
    }

    public getStagedFiles(): PromiseLike<view.FileStageQuickPick[]> {
        return this.fileIndex.updateFiles().then(() =>
            this.fileIndex.getDescriptorsByType([gitCommon.GitStatus.STAGED])
        );
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

    public getChanges(count?: number): Promise<view.ChangeQuickPick[]> {
        let countString = (utils.isNull(count)) ? "" : "&n=" + count;
        return this.get(`changes/?q=status:open+project:${this.settings.project}${countString}`).then(value => {
            let changes: view.ChangeQuickPick[] = [];
            for (let item of value) {
                let change: view.ChangeQuickPick = {
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

    public getPatchsets(change_id: number): Promise<view.PatchsetQuickPick[]> {
        return this.get(`changes/?q=${change_id}&o=CURRENT_REVISION`).then((value: IReview) => {
            let revision_count: number = value[0].revisions[value[0].current_revision]._number;
            let revisions: view.PatchsetQuickPick[] = [];
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

    public checkoutRef(ref: Ref): PromiseLike<string> {
        this.logger.debug(`Checkout Ref:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return this.fetchRef(ref, this.git.checkout);
    }

    public cherrypickRef(ref: Ref): PromiseLike<string> {
        this.logger.debug(`Cherrypick Ref:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return this.fetchRef(ref, this.git.cherrypick);
    }

    private fetchRef<T>(ref: Ref, resolver: (url: string) => PromiseLike<string>): PromiseLike<string | void> {
        return this.git.fetch(ref.getUrl())
            .then(value => resolver.apply(this.git, ["FETCH_HEAD"]))
            .then(value => this.setCurrentRef(ref));
        // TODO: find method to reimplement this but use exit 128 for now
        // return this.isDirty().then(dirty => {
        //     if (dirty) {
        //         let reason: reject.RejectReason = {
        //             showInformation: true,
        //             message: "Dirty Head",
        //             type: reject.RejectType.DEFAULT
        //         };
        //         return Promise.reject(reason);
        //     }
        // });
    }

    public push(branch: string): Promise<string> {
        let target = [
            `HEAD:refs/for/${branch}`
        ];
        return this.git.push(target).then(value => {
            this.setBranch(branch);
            this.updateStatus();
            return value;
        });
    }

    public rebase(branch: string): Promise<string> {
        this.logger.debug(`Rebase Branch:
    Branch: origin/${branch}`);
        return this.git.fetch("", ["-fv"]).then(value => {
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

    private get(path: string): Promise<any> {
        if (utils.isNull(this.settings.host) || utils.isNull(this.settings.httpPort)) {
            return Promise.reject("Host not setup");
        }
        let url = `http://${this.settings.host}:${this.settings.httpPort}/a/${path}`;
        return rp({
            url: url,
            auth: {
                user: this.settings.username,
                pass: this.settings.httpPassword,
                sendImmediately: false
            }
        }).then(
            value => {
                let temp = value.replace(")]}'\n", "");
                let json = JSON.parse(temp);
                return json;
            },
            reason => console.log(reason)
        );
    }
}

export default Gerrit;

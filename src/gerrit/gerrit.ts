import { isNil } from "lodash";
import * as rp from "request-promise";
import Event from "../common/event";
import * as reject from "../common/reject";
import { Settings } from "../common/settings";
import { FileServiceClient } from "../files/fileServiceClient";
import * as gitCommon from "../git/common";
import { Git } from "../git/git";
import { GitLog } from "../git/gitLog";
import * as view from "../view/common";
import { Logger } from "../view/logger";
import { StatusBar } from "../view/statusbar";
import { IReview } from "./gerritAPI";
import { Ref } from "./ref";

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
        this.logger.log("Activating Gerrit...");
        this.git = Git.getInstance();
        this.fileIndex = FileServiceClient.getInstance();
        Event.on("server-ready", Gerrit.handleUpdate);
        Event.on("update-head", Gerrit.handleUpdate);
    }

    static getInstance() {
        if (isNil(Gerrit._gerrit)) {
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
            if (!isNil(value) && !isNil(value.change_id)) {
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
            if (!isNil(reason.attributes) && reason.attributes.stderr.indexOf("does not have any commits yet") > -1) {
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
            if (isNil(value)) {
                return [(isNil(this.getBranch())) ? "master" : this.getBranch()];
            }
            let branches: string[] = [];
            for (let head of value) {
                if (head["ref"].indexOf("refs/heads/") > -1) {
                    branches.push(head["ref"].replace("refs/heads/", ""));
                }
            }
            // Return branches if set, or this.branch or master if all other are null
            return (branches.length > 0) ? branches : [(isNil(this.getBranch())) ? "master" : this.getBranch()];
        });
    }

    public getChanges(count?: number): Promise<view.ChangeQuickPick[]> {
        let countString = (isNil(count)) ? "" : "&n=" + count;
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

    public checkoutRef(ref: Ref): PromiseLike<string | void> {
        this.logger.debug(`Checkout Ref:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return this.fetchRef(ref, (url: string) => this.git.checkout(url));
    }

    public cherrypickRef(ref: Ref): PromiseLike<string | void> {
        this.logger.debug(`Cherrypick Ref:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return this.fetchRef(ref, (url: string) => this.git.cherrypick(url));
    }

    private fetchRef<T>(ref: Ref, resolver: (url: string) => PromiseLike<string>): PromiseLike<string | void> {
        return this.git.fetch(ref.getUrl())
            .then(value => resolver("FETCH_HEAD"))
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

    public draft(branch: string): Promise<string> {
        let target = [
            `HEAD:refs/drafts/${branch}`
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

    private get(path: string): Promise<any> {
        if (isNil(this.settings.url)) {
            return Promise.reject("Gerrit URL is not set");
        }
        const url = `${this.settings.url}/a/${path}`;
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

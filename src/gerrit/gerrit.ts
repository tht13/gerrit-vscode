import { Ref } from "./ref";
import { Logger, LoggerSingleton } from "./logger";
import { GerritSettings } from "./settings";
import { workspace } from "vscode";

export class Gerrit {
    private branch: string;
    private currentRef: Ref;
    private logger: LoggerSingleton;
    private settings: GerritSettings;

    constructor(private workspaceRoot: string, private repo: string, ref: Ref = null) {
        let settings: any = workspace.getConfiguration("gerrit");
        this.settings = <GerritSettings>settings;
        this.logger = Logger.logger;
        this.logger.log("Activating Gerrit...");
        if (ref !== null) {
            this.currentRef = ref;
        }
    }

    public getCurrentRef(): Ref {
        return this.currentRef;
    }

    private setCurrentRef(ref: Ref) {
        this.currentRef = ref;
        this.logger.log(`New Ref:
    ID: ${this.currentRef.getId()}
    Patch Set: ${this.currentRef.getPatchSet()}`);
    }

    public commit(msg: string, files: string[], ammend: boolean): Promise<boolean> {
        this.logger.log(`Commit:
    Message: ${msg}
    Files: ${files}
    Ammend: ${ammend}`);
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    // TODO: isDirty maybe return Promise?
    private isDirty(): boolean {

        return false;
    }

    public checkoutBranch(branch: string): Promise<boolean> {
        this.logger.log(`Checkout Branch:
    Branch: origin/${branch}`);
        this.branch = branch;
        return this.checkout("origin/" + branch);
    }

    public checkoutRef(ref: Ref): Promise<boolean> {
        this.logger.log(`Checkout Branch:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return this.fetchRef(ref, this.checkout);
    }

    public cherrypickRef(ref: Ref): Promise<boolean> {
        this.logger.log(`Cherrypick Branch:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return this.fetchRef(ref, this.cherrypick);
    }

    private fetchRef(ref: Ref, resolver: (url: string) => Promise<boolean>): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.isDirty()) {
                reject("Dirty");
            }

            this.setCurrentRef(ref);

            resolver(ref.getUrl()).then(value => {
                this.cherrypick("FETCH_HEAD").then(value => {
                    resolve(true);
                }, reason => {
                    reject(reason);
                });
            }, reason => {
                reject(reason);
            });
        });
    }

    private fetch(url: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    private checkout(HEAD: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    private cherrypick(HEAD: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    public push(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    public rebase(branch: string): Promise<boolean> {
        this.logger.log(`Rebase Branch:
    Branch: origin/${branch}`);
        return new Promise((resolve, reject) => {
            let url = "" + branch;
            this.fetch(url).then(value => {
                resolve(true);
            }, reason => {
                reject(reason);
            });
        });
    }
}
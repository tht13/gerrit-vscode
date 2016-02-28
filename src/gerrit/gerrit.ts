import { Ref } from "./ref";
import { Logger, LoggerSingleton } from "./logger";
import { GerritSettings } from "./settings";
import { workspace } from "vscode";
import { exec } from "child_process";

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

    public commit(msg: string, files: string[], amend: boolean): Promise<boolean> {
        this.logger.log(`Commit:
    Message: ${msg}
    Files: ${files}
    Amend: ${amend}`);
        return new Promise((resolve, reject) => {
            let args: string[] = [
                "commit",
            ];
            if (amend) {
                args.push("--amend", "--no-edit");
            } else {
                if (msg.length === 0) {
                    reject("Requires a message to commit with");
                }
                // TODO: make it work with spaces
                args.push("-m", msg);
            }
            this.git(args).then(value => {
                resolve(true);
            }, reason => {
                reject(reason);
            })
        });
    }

    // TODO: isDirty maybe return Promise?
    private isDirty(): boolean {

        return false;
    }

    // TODO: checkoutBranch, get branch list
    public checkoutBranch(branch: string): Promise<boolean> {
        this.logger.log(`Checkout Branch:
    Branch: origin/${branch}`);
        this.branch = branch;
        return this.checkout("origin/" + branch);
    }

    // TODO: checkoutRef
    public checkoutRef(ref: Ref): Promise<boolean> {
        this.logger.log(`Checkout Branch:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return this.fetchRef(ref, this.checkout);
    }

    // TODO: cherrypickRef
    public cherrypickRef(ref: Ref): Promise<boolean> {
        this.logger.log(`Cherrypick Branch:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return this.fetchRef(ref, this.cherrypick);
    }

    // TODO: fetchRef
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

    // TODO: fetch
    private fetch(url: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    private checkout(HEAD: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let args = [
                "checkout",
                HEAD
            ];
            this.git(args).then(value => {
                resolve(true);
            }, reason => {
                reject(reason);
            });
        });
    }

    // TODO: cherrypick
    private cherrypick(HEAD: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    // TODO: push
    public push(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    // TODO: rebase
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

    private git(args: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            args.unshift("git");
            let cmd = args.join(" ");
            this.logger.log(cmd);
            exec(cmd, { cwd: this.workspaceRoot }, (error: Error, stdout: Buffer, stderr: Buffer) => {
                if (error === null) {
                    this.logger.log(stdout.toString());
                    resolve(stdout.toString());
                } else {
                    let reason = { error: error, stderr: stderr };
                    console.warn(reason);
                    this.logger.log([error.name, error.message].join("\n"));
                    reject(reason);
                }
            });
        });
    }
}
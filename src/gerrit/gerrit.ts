import { Ref } from "./ref";
import { Logger, LoggerSingleton } from "./logger";
import { GerritSettings } from "./settings";
import { workspace } from "vscode";
import { exec } from "child_process";
import * as http from "http";
import * as https from "https";

// TODO: convert logger.log info messages at function start to debug only
export class Gerrit {
    private branch: string;
    private currentRef: Ref;
    private logger: LoggerSingleton;
    private settings: GerritSettings;

    constructor(private workspaceRoot: string, private repo: string, ref?: Ref) {
        this.settings = new GerritSettings();
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

    // TODO: stage files for commit
    // TODO: stage current file
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
            });
        });
    }

    // TODO: isDirty maybe return Promise?
    private isDirty(): boolean {

        return false;
    }

    // TODO: get branch list??
    public checkoutBranch(branch: string): Promise<boolean> {
        this.logger.log(`Checkout Branch:
    Branch: origin/${branch}`);
        return new Promise((resolve, reject) => {
            this.fetch("", ["-fv"]).then(fetch_value => {
                this.checkout(`origin/${branch}`).then(checkout_value => {
                    this.branch = branch;
                    resolve(true);
                }, checkout_reason => {
                    reject(checkout_reason);
                });
            }, fetch_reason => {
                reject(fetch_reason);
            });
        });
    }

    public checkoutRef(ref: Ref): Promise<boolean> {
        this.logger.log(`Checkout Branch:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return new Promise((resolve, reject) => {
            if (this.isDirty()) {
                reject("Dirty");
            }

            this.setCurrentRef(ref);

            this.fetch(ref.getUrl()).then(value => {
                this.checkout("FETCH_HEAD").then(value => {
                    resolve(true);
                }, reason => {
                    reject(reason);
                });
            }, reason => {
                reject(reason);
            });
        });
    }

    public cherrypickRef(ref: Ref): Promise<boolean> {
        this.logger.log(`Cherrypick Branch:
    ID: ${ref.getId()}
    Patch Set: ${ref.getPatchSet()}`);
        return new Promise((resolve, reject) => {
            if (this.isDirty()) {
                reject("Dirty");
            }

            this.setCurrentRef(ref);

            this.fetch(ref.getUrl()).then(value => {
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

    // TODO: fetchRef, using resolver loses `this` instance, find solution
    // private fetchRef(ref: Ref, resolver: (url: string) => Promise<boolean>): Promise<boolean> {
    //     return new Promise((resolve, reject) => {
    //         if (this.isDirty()) {
    //             reject("Dirty");
    //         }

    //         this.setCurrentRef(ref);

    //         this.fetch(ref.getUrl()).then(value => {
    //             resolver("FETCH_HEAD").then(value => {
    //                 resolve(true);
    //             }, reason => {
    //                 reject(reason);
    //             });
    //         }, reason => {
    //             reject(reason);
    //         });
    //     });
    // }

    private generateFetchUrl(): string {
        if (["http", "ssh"].indexOf(this.settings.protocol) === -1) {
            this.logger.log("Incorrect protocol specified");
            this.logger.log("Must be http or ssh");
            throw new Error("Incorrect protocol specified");
        }
        return `${this.settings.protocol}://${this.settings.host}:${(this.settings.protocol === "http")
            ? this.settings.httpPort : this.settings.sshPort}/${this.settings.project}`;
    }

    private fetch(url: string, options?: string[]): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let args: string[] = [
                "fetch",
                "origin"
            ];
            if (url !== null && url.length > 0) {
                args.push(url);
            }
            if (options !== null) {
                args = args.concat(options);
            }
            this.git(args).then(value => {
                resolve(true);
            }, reason => {
                reject(reason);
            });
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

    // TODO: Add cherry-pick --continue
    private cherrypick(HEAD: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let args = [
                "cherry-pick",
                HEAD
            ];
            this.git(args).then(value => {
                resolve(true);
            }, reason => {
                reject(reason);
            });
        });
    }

    // add option to push to current branch in use
    public push(branch: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let args = [
                "push",
                "origin",
                `HEAD:refs/for/${branch}`
            ];
            this.git(args).then(value => {
                this.branch = branch;
                resolve(true);
            }, reason => {
                reject(reason);
            });
        });
    }

    // TODO: rebase, rebase --continue
    public rebase(branch: string): Promise<boolean> {
        this.logger.log(`Rebase Branch:
    Branch: origin/${branch}`);
        return new Promise((resolve, reject) => {
            this.fetch("", ["-fv"]).then(value => {
                let args: string[] = [
                    "rebase",
                    `origin/${branch}`
                ];
                this.git(args).then(value => {
                    resolve(true);
                }, reason => {
                    reject(reason);
                });
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

    private get(path: string): Promise<Object> {
        let options: https.RequestOptions = {
            host: this.settings.host,
            port: 443,
            path: path,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        };
        return new Promise((resolve, reject) => {
            let req = https.get(options, res => {
                let output = "";
                console.log(options.host + ":" + res.statusCode);
                res.setEncoding("utf8");

                res.on("data", (chunk: string) => {
                    output += chunk;
                });

                res.on("end", () => {
                    let data = JSON.parse(output);
                    resolve(data);
                });
            });

            req.on("error", function(err) {
                reject(err);
            });

            req.end();
        });
    }
}
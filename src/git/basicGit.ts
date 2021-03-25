import { isNil } from "lodash";
import * as exec from "../common/exec";
import * as reject from "../common/reject";
import { Settings } from "../common/settings";
import { BasicLogger } from "../view/simpleLogger";
import { createLog, GitLog } from "./gitLog";


class BasicGit {
    protected settings: Settings;
    protected logger: BasicLogger;
    protected cherrypickActive: boolean;
    protected rebaseActive: boolean;
    private static _basicGit: BasicGit = null;

    constructor() {
        this.settings = Settings.getInstance();
        this.logger = BasicLogger.logger;
        this.cherrypickActive = false;
        this.rebaseActive = false;
    }

    static getInstance() {
        if (isNil(BasicGit._basicGit)) {
            BasicGit._basicGit = new BasicGit();
        }
        return BasicGit._basicGit;
    }

    public stage(path: string): Promise<string> {
        let args = [
            path
        ];
        return this.git("add", [], args);
    }

    public reset(path: string, hard: boolean = false): Promise<string> {
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

    public commit(msg: string, amend: boolean): Promise<string | void> {
        let options: string[] = [];
        if (amend) {
            options.push("--amend", "--no-edit");
        } else {
            if (isNil(msg) || msg.length === 0) {
                let reason: reject.RejectReason = {
                    showInformation: true,
                    message: "Requires a message to commit with",
                    type: reject.RejectType.DEFAULT
                };
                return Promise.reject(reason);
            }
            options.push("--file", "-");
        }
        return this.git("commit", options, [], (!amend) ? msg : null);
    }

    public fetch(url: string = "", options: string[] = [], origin: string = "origin"): Promise<string> {
        let args: string[] = [
            origin
        ];
        if (url.length > 0) {
            args.push(url);
        }
        return this.git("fetch", options, args);
    }

    public checkout(HEAD: string): Promise<string> {
        let options = [
            HEAD
        ];
        return this.git("checkout", options);
    }

    public cherrypick(HEAD: string): Promise<string> {
        let options = [
            HEAD
        ];
        return this.git("cherry-pick", options).then(
            value => value,
            reason => {
                this.cherrypickActive = true;
                return reason;
            }
        );
    }

    // TODO: Broken as vim editor opens
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

    public push(target: string[], origin: string = "origin"): Promise<string> {
        target.unshift(origin);
        return this.git("push", [], target);
    }

    public rebase(branch: string): Promise<string> {
        let args: string[] = [
            branch
        ];
        return this.git("rebase", [], args).then(
            value => value,
            reason => {
                this.rebaseActive = true;
                return reason;
            }
        );
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

    public getGitLog(index: number): Promise<GitLog> {
        let options = [
            "--skip",
            index.toString(),
            "-n",
            "1"
        ];
        return this.git("log", options).then((value: string): Promise<GitLog> => {
            if (isNil(value)) {
                let reason: reject.RejectReason = {
                    showInformation: false,
                    message: "Failed Gitlog",
                    type: reject.RejectType.GIT,
                    attributes: {}
                };
                return Promise.reject(reason);
            }
            return Promise.resolve(createLog(value));
        });
    }

    public diff(options?: string[], args?: string[]): Promise<string> {
        return this.git("diff", options, args, null, false);
    }

    public ls_files(options?: string[]): Promise<string> {
        return this.git("ls-files", options, null, null, false);
    }

    public git(gitCommand: string, options: string[] = [], args: string[] = [], stdin: string = "", log: boolean = true): Promise<string> {
        let fullArgs: string[] = [gitCommand];
        fullArgs = fullArgs.concat(options);
        fullArgs.push("--");
        fullArgs = fullArgs.concat(args);
        this.logger.log(fullArgs.join(" "));

        let runOptions = {
            cwd: this.settings.workspaceRoot,
        };
        if (stdin && stdin.length && stdin.length > 0) {
            runOptions["input"] = stdin + "\n";
        }

        return exec.run("git", fullArgs, runOptions, (log) ? this.logger : null).then((result): Promise<string> => {
            if (isNil(result.error)) {
                return Promise.resolve(result.stdout);
            } else {
                let reason: reject.RejectReason = {
                    showInformation: false,
                    message: "Failed Git",
                    type: reject.RejectType.GIT,
                    attributes: { error: result.error, stderr: result.stderr }
                };
                console.warn(reason);
                this.logger.log(result.error.name);
                return Promise.reject(reason);
            }
        });
    }
}

export default BasicGit;
export { BasicGit };

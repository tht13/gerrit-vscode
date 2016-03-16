import { Ref } from "./ref";
import { createLog, GitLog } from "./gitLog";
import { GerritSettings, IGerritSettings } from "../common/settings";
import { Logger, LoggerSingleton } from "../view/logger";
import * as utils from "../common/utils";
import * as common from "../common/common";
import { Gerrit, IGerrit } from "./gerrit";
import * as exec from "../common/exec";

interface IGit {
    stage(path: string): Promise<string>;
    reset(path: string, hard?: boolean): Promise<string>;
    clean(path: string): Promise<string>;
    commit(msg: string, amend: boolean): Promise<string>;
    fetch(url: string, options?: string[], origin?: string): Promise<string>;
    checkout(HEAD: string): Promise<string>;
    cherrypick(HEAD: string): Promise<string>;
    cherrypickContinue(): Promise<string>;
    push(target: string[], origin?: string): Promise<string>;
    rebase(branch: string): Promise<string>;
    rebaseContinue(): Promise<string>;
    getGitLog(index: number): Promise<GitLog>;
    git(gitCommand: string, options?: string[], args?: string[], stdin?: string): Promise<string>;
}

class GitClass implements IGit {
    private settings: IGerritSettings;
    private logger: LoggerSingleton;
    private cherrypickActive: boolean;
    private rebaseActive: boolean;
    private gerrit: IGerrit;

    constructor() {
        this.gerrit = Gerrit;
        this.settings = GerritSettings;
        this.logger = Logger.logger;
        this.cherrypickActive = false;
        this.rebaseActive = false;
    }

    public stage(path: string): Promise<string> {
        let args = [
            path
        ];
        return this.git("add", [], args);
    }

    public reset(path: string, hard?: boolean): Promise<string> {
        hard = utils.setDefault(hard, false);
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
                Promise.reject(reason);
            }
            options.push("--file", "-");
        }
        return this.git("commit", options, [], (!amend) ? msg : null);
    }

    public fetch(url: string, options?: string[], origin?: string): Promise<string> {
        url = utils.setDefault(url, "");
        options = utils.setDefault(options, []);
        origin = utils.setDefault(origin, "origin");
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

    public push(target: string[], origin?: string): Promise<string> {
        origin = utils.setDefault(origin, "origin");
        target.unshift(origin);
        return this.git("push", [], target).then(value => {
            return value;
        });
    }

    // TODO: check how rejections are passed through
    public rebase(branch: string): Promise<string> {
        let args: string[] = [
            branch
        ];
        return this.git("rebase", [], args).then(value => {
            return value;
        }, reason => {
            this.rebaseActive = true;
            return reason;
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

    public getGitLog(index: number): Promise<GitLog> {
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

    public git(gitCommand: string, options?: string[], args?: string[], stdin?: string): Promise<string> {
        options = utils.setDefault(options, []);
        args = utils.setDefault(args, []);
        stdin = utils.setDefault(stdin, "");
        let fullArgs: string[] = [gitCommand];
        fullArgs = fullArgs.concat(options);
        fullArgs.push("--");
        fullArgs = fullArgs.concat(args);
        this.logger.log(fullArgs.join(" "));

        let runOptions = {
            cwd: this.settings.workspaceRoot,
        };
        if (stdin.length > 0) {
            runOptions["input"] = stdin + "\n";
        }

        return exec.run("git", fullArgs, runOptions).then(result => {
            if (result.error === null) {
                return result.stdout;
            } else {
                let reason: common.RejectReason = {
                    showInformation: false,
                    message: "Failed Git",
                    type: common.RejectType.GIT,
                    attributes: { error: result.error, stderr: result.stderr }
                };
                console.warn(reason);
                this.logger.log(result.error.name);
                Promise.reject(reason);
                return;
            }
        });
    }
}

class GitSingleton {
    private static _git: GitClass = null;

    static get git() {
        if (utils.isNull(GitSingleton._git)) {
            GitSingleton._git = new GitClass();
        }
        return GitSingleton._git;
    }
}

const Git = GitSingleton.git;
export default Git;
export { Git, IGit };

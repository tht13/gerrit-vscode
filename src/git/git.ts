import { BasicGit } from "./basicGit";
import { createLog, GitLog } from "./gitLog";
import * as exec from "../common/exec";
import * as reject from "../common/reject";
import { Settings } from "../common/settings";
import * as utils from "../common/utils";
import { Logger } from "../view/logger";


class Git extends BasicGit {
    private static _git: Git = null;

    constructor() {
        super();
        this.logger = Logger.logger;
    }

    static getInstance() {
        if (utils.isNull(Git._git)) {
            Git._git = new Git();
        }
        return Git._git;
    }
}

export default Git;
export { Git };

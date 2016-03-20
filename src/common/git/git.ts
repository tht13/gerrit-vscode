import { BasicGit } from "./basicGit";
import { createLog, GitLog } from "./gitLog";
import * as exec from "../exec";
import * as reject from "../reject";
import { Settings } from "../settings";
import * as utils from "../utils";
import { Logger } from "../../view/logger";


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

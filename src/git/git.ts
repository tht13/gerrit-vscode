import { BasicGit } from "./basicGit";
import { createLog, GitLog } from "./gitLog";
import Event from "../common/event";
import * as exec from "../common/exec";
import * as reject from "../common/reject";
import { Settings } from "../common/settings";
import * as utils from "../common/utils";
import { Gerrit } from "../gerrit/gerrit";
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

    public push(target: string[], origin?: string): Promise<string> {
     return super.push(target, origin).then(value => {
            Event.emit("update-head", Gerrit.getInstance());
            return value;
        });
    }
}

export default Git;
export { Git };

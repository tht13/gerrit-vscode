import { isNil } from "lodash";
import Event from "../common/event";
import { Logger } from "../view/logger";
import { BasicGit } from "./basicGit";


class Git extends BasicGit {
    private static _git: Git = null;

    constructor() {
        super();
        this.logger = Logger.logger;
    }

    static getInstance() {
        if (isNil(Git._git)) {
            Git._git = new Git();
        }
        return Git._git;
    }

    public push(target: string[], origin?: string): Promise<string> {
        return super.push(target, origin).then(value => {
            Event.emit("update-head");
            return value;
        });
    }
}

export default Git;
export { Git };

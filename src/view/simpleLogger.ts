import * as utils from "../common/utils";

export class BasicLogger {
    protected debugMode: boolean = false;
    private static _basicLogger: BasicLogger = null;

    constructor() {
    }

    static get logger() {
        if (utils.isNull(BasicLogger._basicLogger)) {
            BasicLogger._basicLogger = new BasicLogger();
        }
        return BasicLogger._basicLogger;
    }

    setDebug(value: boolean) {
        this.debugMode = value;
    }

    log(value: string, show?: boolean) {
        show = utils.setDefault(show, true);
        let lines: string[] = value.split(utils.SPLIT_LINE);
        for (let i in lines) {
            console.log(lines[i]);
        }
    }

    debug(value: string) {
        if (!this.debugMode) {
            return;
        }
        this.log(value);
    }
}

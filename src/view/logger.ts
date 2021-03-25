import { isNil } from "lodash";
import { OutputChannel, window } from "vscode";
import Settings from "../common/settings";
import * as utils from "../common/utils";
import { BasicLogger } from "./simpleLogger";

export class Logger extends BasicLogger {
    private outputChannel: OutputChannel;
    private static _logger: Logger = null;
    private visible: boolean = false;

    constructor() {
        super();
        this.outputChannel = window.createOutputChannel("Gerrit");
    }

    static get logger() {
        if (isNil(Logger._logger)) {
            Logger._logger = new Logger();
        }
        return Logger._logger;
    }

    log(value: string) {
        if (!isNil(Settings.getInstance().showLog && Settings.getInstance().showLog)) {
            this.outputChannel.show(true);
        }
        let lines: string[] = value.split(utils.SPLIT_LINE);
        for (let i in lines) {
            this.outputChannel.appendLine(lines[i]);
        }
    }

    toggleLog() {
        this.visible ? this.outputChannel.hide() : this.outputChannel.show(true);
        this.visible = !this.visible;
    }
}

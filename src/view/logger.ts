import { window, OutputChannel } from "vscode";
import * as utils from "../common/utils";

export class Logger {
    private outputChannel: OutputChannel;
    private visible: boolean = false;
    private debugMode: boolean = false;
    private static _logger: Logger = null;

    constructor() {
        this.outputChannel = window.createOutputChannel("Gerrit");
    }

    static get logger() {
        if (utils.isNull(Logger._logger)) {
            Logger._logger = new Logger();
        }
        return Logger._logger;
    }

    setDebug(value: boolean) {
        this.debugMode = value;
    }

    log(value: string, show?: boolean) {
        show = utils.setDefault(show, true);
        if (show) {
            this.outputChannel.show(true);
        }
        let lines: string[] = value.split(utils.SPLIT_LINE);
        for (let i in lines) {
            this.outputChannel.appendLine(lines[i]);
        }
    }

    debug(value: string) {
        if (!this.debugMode) {
            return;
        }
        this.log(value);
    }
}

import { window, OutputChannel } from "vscode";
import { BasicLogger } from "./simpleLogger";
import * as utils from "../common/utils";

export class Logger extends BasicLogger {
    private outputChannel: OutputChannel;
    private static _logger: Logger = null;

    constructor() {
        super();
        this.outputChannel = window.createOutputChannel("Gerrit");
    }

    static get logger() {
        if (utils.isNull(Logger._logger)) {
            Logger._logger = new Logger();
        }
        return Logger._logger;
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
}

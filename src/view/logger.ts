import { window, OutputChannel } from "vscode";
import * as utils from "../common/utils";

export class Logger {
    private static _logger: LoggerSingleton = null;

    static get logger() {
        if (utils.isNull(Logger._logger)) {
            Logger._logger = new LoggerSingletonClass();
        }
        return Logger._logger;
    }

}

export interface LoggerSingleton {
    setDebug(value: boolean): void;
    log(value: string, show?: boolean): void;
    debug(value: string): void;
}

class LoggerSingletonClass implements LoggerSingleton {
    private outputChannel: OutputChannel;
    private visible: boolean = false;
    private debugMode: boolean = false;

    constructor() {
        this.outputChannel = window.createOutputChannel("Gerrit");
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
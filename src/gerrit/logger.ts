import { window, OutputChannel } from "vscode";

export class Logger {
    private static _logger: LoggerSingleton = null;

    static get logger() {
        if (Logger._logger === null) {
            Logger._logger = new LoggerSingleton();
        }
        return Logger._logger;
    }

}

class LoggerSingleton {
    private outputChannel: OutputChannel;
    private visible: boolean = false;
    constructor() {
        this.outputChannel = window.createOutputChannel("Gerrit");
    }

    log(value: string) {
        let lines: string[] = value.split(new RegExp("\\n\\r?", "gmi"));
        for (let i in lines) {
            this.outputChannel.appendLine(lines[i]);
        }
    }

}
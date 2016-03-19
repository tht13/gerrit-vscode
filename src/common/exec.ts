import { spawn, ChildProcess } from "child_process";
import * as utils from "./utils";
import { Logger } from "../view/logger";

export function run(command: string, args: string[], options: any, log?: boolean): Promise<{ exit_code: number, error: Error, stdout: string, stderr: string }> {
    log = utils.setDefault(log, true);
    let child = spawn(command, args, options);

    if (options.input) {
        child.stdin.end(options.input, "utf8");
    }

    return exec(child, log).then(value => {
        if (!utils.isNull(value.error)) {
            value.error.name = `Command ${command} ${args.join(" ")} failed with exit code: ${value.exit_code}`;
        }
        return value;
    });
}

function exec(child: ChildProcess, log: boolean): Promise<{ exit_code: number, error: Error, stdout: string, stderr: string }> {
    let result = {
        exit_code: 0,
        error: null,
        stdout: "",
        stderr: ""
    };
    let stderrPromise = new Promise((resolve, reject) => {
        let stderr: Buffer[] = [];
        child.stderr.on("data", (b: Buffer) => {
            Logger.logger.log(b.toString());
            stderr.push(b);
        });
        child.stderr.on("close", () => {
            result.stderr = Buffer.concat(stderr).toString();
            resolve();
        });
    });
    let stdoutPromise = new Promise((resolve, reject) => {
        let stdout: Buffer[] = [];
        child.stdout.on("data", (b: Buffer) => {
            if (log) Logger.logger.log(b.toString());
            stdout.push(b);
        });
        child.stdout.on("close", () => {
            result.stdout = Buffer.concat(stdout).toString();
            resolve();
        });
    });
    let childPromise = new Promise((resolve, reject) => {
        child.on("error", e => {
            result.error = e;
        });
        child.on("exit", (exit_code: number) => {
            result.exit_code = exit_code;
            resolve();
        });
    });
    return Promise.all([
        stderrPromise,
        stdoutPromise,
        childPromise
    ]).then(values => {
        if (result.exit_code !== 0) {
            let error = new Error(result.stderr);
            result.error = error;
            console.log(error.stack);
        }
        return result;
    });
}


import { spawn, ChildProcess } from "child_process";
import { Logger } from "../view/logger";
import * as utils from "./utils";

export function run(command: string, args: string[], options: any): Promise<{ exit_code: number, error: Error, stdout: string, stderr: string }> {
    let child = spawn(command, args, options);

    if (options.input) {
        child.stdin.end(options.input, "utf8");
    }

    return exec(child).then(value => {
        if (!utils.isNull(value.error)) {
            value.error.name = `Command ${command} ${args.join(" ")} failed with exit code: ${value.exit_code}`;
        }
        return value;
    });
}

function exec(child: ChildProcess): Promise<{ exit_code: number, error: Error, stdout: string, stderr: string }> {
    return new Promise((resolve, reject) => {
        let result = {
            exit_code: 0,
            error: null,
            stdout: "",
            stderr: ""
        };
        let active = {
            stdout: false,
            stderr: false
        };
        let stdout: Buffer[] = [];
        let stderr: Buffer[] = [];
        child.on("error", e => {
            result.error = e;
            checkExit();
        });
        child.on("exit", (exit_code: number) => {
            checkExit(exit_code);
        });
        child.stdout.on("data", (b: Buffer) => {
            Logger.logger.log(b.toString());
            stdout.push(b);
        });
        child.stdout.on("close", () => {
            result.stdout = Buffer.concat(stdout).toString();
            active.stdout = true;
            checkExit();
        });
        child.stderr.on("data", (b: Buffer) => {
            Logger.logger.log(b.toString());
            stderr.push(b);
        });
        child.stderr.on("close", () => {
            result.stderr = Buffer.concat(stderr).toString();
            active.stderr = true;
            checkExit();
        });

        function checkExit(exit_code?: number) {
            if (!utils.isNull(exit_code)) {
                result.exit_code = exit_code;
            }
            for (let channel in active) {
                if (!active[channel]) {
                    return;
                }
            }
            if (result.exit_code !== 0) {
                let error = new Error(result.stderr);
                result.error = error;
                console.log(error.stack);
            }
            resolve(result);
        }

    });
}


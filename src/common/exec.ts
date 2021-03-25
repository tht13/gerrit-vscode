import { ChildProcess, spawn } from "child_process";
import { isNil } from "lodash";
import { BasicLogger } from "../view/simpleLogger";

export function run(command: string, args: string[], options: any, logger: BasicLogger = null): Promise<{ exit_code: number, error: Error, stdout: string, stderr: string }> {
    let child = spawn(command, args, options);

    if (options.input) {
        child.stdin.end(options.input, "utf8");
    }

    return exec(child, logger).then(value => {
        if (!isNil(value.error)) {
            value.error.name = `${value.error}\nCommand ${command} ${args.join(" ")} failed with exit code: ${value.exit_code}`;
        }
        return value;
    });
}

function exec(child: ChildProcess, log: BasicLogger): Promise<{ exit_code: number, error: Error, stdout: string, stderr: string }> {
    let result = {
        exit_code: 0,
        error: null,
        stdout: "",
        stderr: ""
    };
    let stderrPromise = new Promise<void>((resolve, reject) => {
        let stderr: Buffer[] = [];
        child.stderr.on("data", (b: Buffer) => {
            if (!isNil) { log.log(b.toString()); }
            stderr.push(b);
        });
        child.stderr.on("close", () => {
            result.stderr = Buffer.concat(stderr).toString();
            resolve();
        });
    });
    let stdoutPromise = new Promise<void>((resolve, reject) => {
        let stdout: Buffer[] = [];
        child.stdout.on("data", (b: Buffer) => {
            if (!isNil(log)) { log.log(b.toString()); }
            stdout.push(b);
        });
        child.stdout.on("close", () => {
            result.stdout = Buffer.concat(stdout).toString();
            resolve();
        });
    });
    let childPromise = new Promise<void>((resolve, reject) => {
        child.on("error", e => result.error = e);
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


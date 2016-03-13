import { spawn, ChildProcess } from "child_process";

export function run(command: string, args: string[], options: any): Promise<{ error: Error, stdout: string, stderr: string }> {
    let child = spawn(command, args, options);

    if (options.input) {
        child.stdin.end(options.input, "utf8");
    }

    return exec(child);

}

function exec(child: ChildProcess): Promise<{ error: Error, stdout: string, stderr: string }> {
    return new Promise((resolve, reject) => {
        let result = {
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
        child.on("exit", checkExit);
        child.stdout.on("data", b => stdout.push(b));
        child.stdout.on("close", () => {
            result.stdout = Buffer.concat(stdout).toString();
            active.stdout = true;
            checkExit();
        });
        child.stderr.on("data", b => stderr.push(b));
        child.stderr.on("close", () => {
            result.stderr = Buffer.concat(stderr).toString();
            active.stderr = true;
            checkExit();
        });

        function checkExit() {
            for (let channel in active) {
                if (!active[channel]) {
                    return;
                }
            }
            resolve(result);
        }

    });
}


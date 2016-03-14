let rp = require("request-promise");

export function restGet(path: string): Promise<any> {
    let url = `http://${this.settings.host}:${this.settings.httpPort}/a/${path}`;
    console.log(url);
    let options = {
        url: url,
        auth: {
            user: this.settings.username,
            pass: this.settings.httpPassword,
            sendImmediately: false
        }
    };
    return rp(options).then(value => {
        return JSON.parse(value.replace(")]}'\n", ""));
    }, reason => {
        console.log(reason);
    });
}

import { workspace } from "vscode";

export class GerritSettings {
    private _host: string;
    private _protocol: string;
    private _httpPort: number;
    private _sshPort: number;
    private _username: string;
    private _project: string;
    private _version: string;

    constructor() {
        this.loadSettings();
        workspace.onDidChangeConfiguration(() => {
            this.loadSettings();
        });
    }

    private loadSettings(): void {
        let settings: any = workspace.getConfiguration("gerrit");
        this._host = settings.host;
        this._protocol = settings.protocol;
        this._httpPort = settings.httpPort;
        this._sshPort = settings.sshPort;
        this._username = settings.username;
        this._project = settings.project;
        this._version = settings.version;
    }

    get host(): string {
        return this._host;
    }

    get protocol(): string {
        return this._protocol;
    }

    get httpPort(): number {
        return this._httpPort;
    }

    get sshPort(): number {
        return this._sshPort;
    }

    get username(): string {
        return this._username;
    }

    // TODO: Get this automatically?
    get project(): string {
        return this._project;
    }

    get version(): string {
        return this._version;
    }
}

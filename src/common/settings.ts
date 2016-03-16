import { workspace } from "vscode";

interface IGerritSettings {

    host: string;

    protocol: string;

    httpPort: number;

    sshPort: number;

    username: string;

    project: string;

    version: string;

    httpPassword: string;

    workspaceRoot: string;
}

class GerritSettingsClass implements IGerritSettings {
    private _host: string;
    private _protocol: string;
    private _httpPort: number;
    private _sshPort: number;
    private _username: string;
    private _project: string;
    private _version: string;
    private _httpPassword: string;
    private _workspaceRoot: string;

    constructor() {
        this._workspaceRoot = workspace.rootPath;
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
        this._httpPassword = settings.httpPassword;
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

    get project(): string {
        return this._project;
    }

    set project(project: string) {
        this._project = project;
    }

    get version(): string {
        return this._version;
    }

    get httpPassword(): string {
        return this._httpPassword;
    }

    get workspaceRoot(): string {
        return this._workspaceRoot;
    }
}

class GerritSettingsSingleton {
    private static _gerritSettings: GerritSettingsClass = null;

    static get gerritSettings() {
        if (GerritSettingsSingleton._gerritSettings === null) {
            GerritSettingsSingleton._gerritSettings = new GerritSettingsClass();
        }
        return GerritSettingsSingleton._gerritSettings;
    }
}

const GerritSettings = GerritSettingsSingleton.gerritSettings;
export default GerritSettings;
export { GerritSettings, IGerritSettings };

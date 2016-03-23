export interface SettingsExport {
    host: string;
    protocol: string;
    httpPort: number;
    sshPort: number;
    username: string;
    project: string;
    version: string;
    httpPassword: string;
    workspaceRoot: string;
    extensionRoot: string;
}

class Settings {
    private _host: string;
    private _protocol: string;
    private _httpPort: number;
    private _sshPort: number;
    private _username: string;
    private _project: string;
    private _version: string;
    private _httpPassword: string;
    private _workspaceRoot: string;
    private _extensionRoot: string;
    private static _settings: Settings = null;

    constructor() {
    }

    static getInstance() {
        if (Settings._settings === null) {
            Settings._settings = new Settings();
        }
        return Settings._settings;
    }

    public loadSettings(settings: any): void {
        this._host = settings.host;
        this._protocol = settings.protocol;
        this._httpPort = settings.httpPort;
        this._sshPort = settings.sshPort;
        this._username = settings.username;
        this._project = settings.project;
        this._version = settings.version;
        this._httpPassword = settings.httpPassword;
    }

    exportSettings(): SettingsExport {
        return {
            host: this._host,
            protocol: this._protocol,
            httpPort: this._httpPort,
            sshPort: this._sshPort,
            username: this._username,
            project: this._project,
            version: this._version,
            httpPassword: this._httpPassword,
            workspaceRoot: this._workspaceRoot,
            extensionRoot: this._extensionRoot
        };
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

    set workspaceRoot(value: string) {
        this._workspaceRoot = value;
    }

    get extensionRoot(): string {
        return this._extensionRoot;
    }

    set extensionRoot(value: string) {
        this._extensionRoot = value;
    }
}

export default Settings;
export { Settings };

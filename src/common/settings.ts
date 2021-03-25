import Event from "../common/event";

export interface SettingsExport {
    showLog: boolean;
    url: string;
    username: string;
    project: string;
    httpPassword: string;
    workspaceRoot: string;
    extensionRoot: string;
}

class Settings {
    private _active: boolean;
    private _showLog: boolean;
    private _url: string;
    private _username: string;
    private _project: string;
    private _httpPassword: string;
    private _workspaceRoot: string;
    private _extensionRoot: string;
    private static instance: Settings;

    private constructor() { }

    public static getInstance(): Settings {
        if (!Settings.instance) {
            Settings.instance = new Settings();
        }
        return Settings.instance;
    }

    public loadSettings(settings: any): void {
        this._active = settings.active;
        this._showLog = settings.showLog;
        this._url = settings.url;
        this._username = settings.username;
        this._project = settings.project;
        this._httpPassword = settings.httpPassword;
        this.emitUpdate();
    }

    exportSettings(): SettingsExport {
        return {
            url: this._url,
            showLog: this._showLog,
            username: this._username,
            project: this._project,
            httpPassword: this._httpPassword,
            workspaceRoot: this._workspaceRoot,
            extensionRoot: this._extensionRoot
        };
    }

    private emitUpdate() {
        Event.emit("settings-update");
    }

    get active(): boolean {
        return this._active;
    }

    get showLog(): boolean {
        return this._showLog;
    }

    get url(): string {
        return this._url;
    }

    get username(): string {
        return this._username;
    }

    get project(): string {
        return this._project;
    }

    set project(project: string) {
        this._project = project;
        this.emitUpdate();
    }

    get httpPassword(): string {
        return this._httpPassword;
    }

    get workspaceRoot(): string {
        return this._workspaceRoot;
    }

    set workspaceRoot(value: string) {
        this._workspaceRoot = value;
        this.emitUpdate();
    }

    get extensionRoot(): string {
        return this._extensionRoot;
    }

    set extensionRoot(value: string) {
        this._extensionRoot = value;
        this.emitUpdate();
    }
}

export default Settings;
export { Settings };

import * as path from "path";
import { isNil } from "lodash";
import { workspace } from "vscode";
import { ServerOptions, LanguageClientOptions, LanguageClient, TransportKind } from "vscode-languageclient";
import * as fileCommon from "./common";
import { Request, RequestResult, RequestEventType, RequestParams, RequestPackage } from "./fileServiceInterface";
import Event from "../common/event";
import { Settings } from "../common/settings";
import * as gitCommon from "../git/common";
import { Gerrit } from "../gerrit/gerrit";

export class FileServiceClient {
    private languageClient: LanguageClient;
    private static _client: FileServiceClient = null;

    constructor() {
    }

    static getInstance() {
        if (isNil(FileServiceClient._client)) {
            FileServiceClient._client = new FileServiceClient();
        }
        return FileServiceClient._client;
    }

    static handleUpdate() {
        return FileServiceClient.getInstance().sendSettings();
    }

    private getOptions(): { serverOptions: ServerOptions, clientOptions: LanguageClientOptions } {
        let serverModule = path.join(Settings.getInstance().extensionRoot, "out", "src",
            "files", "server", "fileServiceServer.js");
        let debugOptions = {
            execArgv: ["--nolazy", "--debug=6004"],
            cwd: Settings.getInstance().extensionRoot
        };

        // If the extension is launch in debug mode the debug server options are use
        // Otherwise the run options are used
        let serverOptions: ServerOptions = {
            run: {
                module: serverModule, transport: TransportKind.ipc, options: {
                    cwd: Settings.getInstance().extensionRoot
                }
            },
            debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
        };

        let clientOptions: LanguageClientOptions = {
            synchronize: {
                configurationSection: "gerrit"
            },
            initializationOptions: {
                debug: true
            }
        };

        return { "serverOptions": serverOptions, "clientOptions": clientOptions };
    }

    private doRequest(eventType: RequestEventType, payload?: RequestPackage) {
        let params: RequestParams = {
            processId: process.pid,
            requestEventType: eventType,
            package: payload
        };
        return this.languageClient.sendRequest(Request.type, params);
    }

    getDescriptors() {
        return this.doRequest(RequestEventType.DESCRIPTORSALL).then(value =>
            <fileCommon.BasciFileQuickPick[]>value.package
        );
    }

    getDescriptorsByType(type: gitCommon.GitStatus[]) {
        return this.doRequest(RequestEventType.DESCRIPTORSTYPE, type).then(value =>
            <fileCommon.BasciFileQuickPick[]>value.package
        );
    }

    updateFiles() {
        return this.doRequest(RequestEventType.UPDATE);
    }

    sendSettings() {
        return this.doRequest(RequestEventType.SETTINGS, Settings.getInstance().exportSettings());
    }

    startServer() {
        let options = this.getOptions();
        this.languageClient = new LanguageClient("Global File Container", options.serverOptions, options.clientOptions);
        let start = this.languageClient.start();
        this.languageClient.onReady().then(value => {
            console.log("Server Ready");
            this.sendSettings().then(value => Event.emit("server-ready"));
        });
        Event.on("settings-update", FileServiceClient.handleUpdate);
        return start;
    }
}
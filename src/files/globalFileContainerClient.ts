import * as path from "path";
import { workspace } from "vscode";
import { ServerOptions, LanguageClientOptions, LanguageClient, TransportKind } from "vscode-languageclient";
import * as fileCommon from "./common";
import { Request, RequestResult, RequestEventType, RequestParams, RequestPackage } from "./globalFileContainerInterface";
import Event from "../common/event";
import { Settings } from "../common/settings";
import * as utils from "../common/utils";
import { Gerrit } from "../gerrit/gerrit";

export class GlobalFileContainerClient {
    private languageClient: LanguageClient;
    private static _client: GlobalFileContainerClient = null;

    constructor() {
    }

    static getInstance() {
        if (utils.isNull(GlobalFileContainerClient._client)) {
            GlobalFileContainerClient._client = new GlobalFileContainerClient();
        }
        return GlobalFileContainerClient._client;
    }

    private getOptions(): { serverOptions: ServerOptions, clientOptions: LanguageClientOptions } {
        let serverModule = path.join(Settings.getInstance().extensionRoot, "out", "src",
            "files", "globalFileContainerServer.js");
        let debugOptions = {
            execArgv: ["--nolazy", "--debug=6004"],
            // cwd: GerritSettings.getInstance().extensionRoot
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
            // Register the server for plain text documents
            documentSelector: ["plaintext"],
            synchronize: {
                // Synchronize the setting section "languageServerExample" to the server
                configurationSection: "languageServerExample",
                // Notify the server about file changes to ".clientrc files contain in the workspace
                fileEvents: workspace.createFileSystemWatcher("**/.clientrc")
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
        return this.doRequest(RequestEventType.DESCRIPTORS).then(value => {
            return <fileCommon.BasciFileQuickPick[]>value.package;
        });
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
            this.sendSettings().then(value => {
                Event.emit("server-ready", Gerrit.getInstance());
            });
        });
        Event.on("settings-update", this.sendSettings);
        return start;
    }
}
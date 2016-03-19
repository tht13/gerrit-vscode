import { workspace } from "vscode";
import { Settings } from "../common/settings";
import * as path from "path";
import { ServerOptions, LanguageClientOptions, LanguageClient, TransportKind } from "vscode-languageclient";
import { Request, RequestResult, RequestEventType, RequestParams } from "./globalFileContainerInterface";
import * as utils from "../common/utils";

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
            "gerrit", "files", "globalFileContainerServer.js");
        let debugOptions = {
            execArgv: ["--nolazy", "--debug=6004"],
            // cwd: GerritSettings.getInstance().extensionRoot
        };

        // If the extension is launch in debug mode the debug server options are use
        // Otherwise the run options are used
        let serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc, options: {
                cwd: Settings.getInstance().extensionRoot
            } },
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

    doRequest(eventType: RequestEventType) {
        let params: RequestParams = {
            processId: process.pid,
            requestEventType: eventType
        };
        return this.languageClient.sendRequest(Request.type, params);
    }

    startServer() {
        let options = this.getOptions();
        this.languageClient = new LanguageClient("Global File Container", options.serverOptions, options.clientOptions);
        let start = this.languageClient.start();
        this.languageClient.onReady().then(value => {
            console.log("ready");
        });
        return start;
    }
}
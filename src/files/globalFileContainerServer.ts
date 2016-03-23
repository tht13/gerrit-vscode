import {
    IPCMessageReader, IPCMessageWriter,
    createConnection, IConnection, InitializeResult, TextDocuments } from "vscode-languageserver";
import { GlobalFileContainer } from "./globalFileContainer";
import { Request, RequestResult, RequestEventType, RequestParams } from "./globalFileContainerInterface";
import { Settings, SettingsExport } from "../common/settings";

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let container = new GlobalFileContainer();
let workspaceRoot: string;

connection.onInitialize((params): InitializeResult => {
    // connection.console.log(params.initializationOptions);
    workspaceRoot = params.rootPath;
    return {
        capabilities: {
        }
    };
});

connection.onRequest(Request.type, (params: RequestParams): RequestResult | Thenable<RequestResult> => {
    connection.console.log("Recieved event");
    switch (params.requestEventType) {
        case RequestEventType.UPDATE:
            return container.updateFiles().then(value => {
                return {
                    message: "complete",
                    succesful: true
                };
            });
        case RequestEventType.DESCRIPTORS:
            return {
                succesful: true,
                package: container.getDescriptorsAll()
            };
        case RequestEventType.SETTINGS:
            let settings = Settings.getInstance();
            settings.loadSettings(params.package);
            let payload = <SettingsExport>params.package;
            settings.extensionRoot = payload.extensionRoot;
            settings.workspaceRoot = payload.workspaceRoot;
            return {
                message: "complete",
                succesful: true
            };
    }
    return {
        message: "complete",
        succesful: false
    };
});

connection.listen();

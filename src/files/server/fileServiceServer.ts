import { Connection, createConnection, InitializeResult, IPCMessageReader, IPCMessageWriter } from "vscode-languageserver/node";
import { Settings, SettingsExport } from "../../common/settings";
import * as gitCommon from "../../git/common";
import { Request, RequestEventType, RequestParams, RequestResult } from "../fileServiceInterface";
import { FileService } from "./fileService";

let connection: Connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let container = new FileService();
container.updateFiles();
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
    switch (params.requestEventType) {
        case RequestEventType.UPDATE:
            return container.updateFiles().then(value => {
                return {
                    message: "complete",
                    succesful: true
                };
            });
        case RequestEventType.DESCRIPTORSALL:
            return {
                succesful: true,
                package: container.getDescriptorsAll()
            };
        case RequestEventType.DESCRIPTORSTYPE:
            return {
                succesful: true,
                package: container.getDescriptorsByType(<gitCommon.GitStatus[]>params.package)
            };
        case RequestEventType.SETTINGS:
            let settings = Settings.getInstance();
            settings.loadSettings(params.package);
            let payload = <SettingsExport>params.package;
            settings.extensionRoot = payload.extensionRoot;
            settings.workspaceRoot = payload.workspaceRoot;
            return {
                message: "complete",
                succesful: true,
                package: settings.exportSettings()
            };
    }
    return {
        message: "complete",
        succesful: false
    };
});

connection.listen();

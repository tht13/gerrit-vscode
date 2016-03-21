import {
    IPCMessageReader, IPCMessageWriter,
    createConnection, IConnection, InitializeResult, TextDocuments } from "vscode-languageserver";
import { GlobalFileContainer } from "./globalFileContainer";
import { Request, RequestResult, RequestEventType, RequestParams } from "./globalFileContainerInterface";

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

connection.console.log("active");
// import * as fs from "fs";
// import * as path from "path";
// fs.writeFile(path.join("C:", "example.txt"), "hello");

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
            // TODO: Return updateFiles
            break;
    }
    return {
        message: "complete",
        succesful: true
    };
});

connection.listen();
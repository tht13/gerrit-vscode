import {
IPCMessageReader, IPCMessageWriter,
createConnection, IConnection, InitializeResult, TextDocuments } from "vscode-languageserver";
import { GlobalFileContainer } from "./globalFileContainer";
import { Request, RequestResult, RequestEventType, RequestParams } from "./globalFileContainerInterface";

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let container = new GlobalFileContainer();
let workspaceRoot: string;

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

connection.onInitialize((params): InitializeResult => {
    // connection.console.log(params.initializationOptions);
    workspaceRoot = params.rootPath;
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind
        }
    };
});

connection.console.log("active");
// import * as fs from "fs";
// import * as path from "path";
// fs.writeFile(path.join("C:", "example.txt"), "hello");

connection.onRequest(Request.type, (params: RequestParams): RequestResult => {
    connection.console.log("Recieved event");
    return {
        message: "complete",
        succesful: true
    };
});

connection.listen();
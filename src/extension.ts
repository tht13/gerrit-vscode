"use strict";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
    let commands: vscode.Disposable[] = [];
    commands.push(
        vscode.commands.registerCommand("gerrit.checkOutBranch", () => {
            vscode.window.showInformationMessage("Gerrit: Check out branch");
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.checkOutRevision", () => {
            vscode.window.showInformationMessage("Gerrit: Check out revision");
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.commitAmend", () => {
            vscode.window.showInformationMessage("Gerrit: Commit amend");
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.pushBranch", () => {
            vscode.window.showInformationMessage("Gerrit: Push to branch");
        })
    );

    context.subscriptions.concat(commands);
}

export function deactivate() {
}

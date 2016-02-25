"use strict";
import * as vscode from "vscode";
import { Gerrit } from "./gerrit/gerrit";

export function activate(context: vscode.ExtensionContext) {
    let commands: vscode.Disposable[] = [];
    commands.push(
        vscode.commands.registerCommand("gerrit.checkoutBranch", () => {
            vscode.window.showInformationMessage("Gerrit: Check out branch");
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.checkoutRevision", () => {
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

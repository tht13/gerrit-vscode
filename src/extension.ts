"use strict";
import * as vscode from "vscode";
import { Gerrit } from "./gerrit/gerrit";
import { GerritController } from "./gerrit/controller";

export function activate(context: vscode.ExtensionContext) {
    let commands: vscode.Disposable[] = [];
    let gerrit: Gerrit = new Gerrit("", "");
    let controller: GerritController = new GerritController(gerrit);

    commands.push(
        vscode.commands.registerCommand("gerrit.checkoutBranch", () => {
            vscode.window.showInformationMessage("Gerrit: Check out branch");
            controller.checkoutBranch();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.checkoutRevision", () => {
            vscode.window.showInformationMessage("Gerrit: Check out revision");
            controller.checkoutRevision();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.commitAmend", () => {
            vscode.window.showInformationMessage("Gerrit: Commit amend");
            controller.commitAmend();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.pushBranch", () => {
            vscode.window.showInformationMessage("Gerrit: Push to branch");
            controller.commit();
        })
    );

    context.subscriptions.concat(commands);
}

export function deactivate() {
}

"use strict";
import * as vscode from "vscode";
import { Gerrit } from "./gerrit/gerrit";
import { GerritController } from "./gerrit/controller";

export function activate(context: vscode.ExtensionContext) {
    let commands: vscode.Disposable[] = [];
    let gerrit: Gerrit = new Gerrit(vscode.workspace.rootPath, "");
    let controller: GerritController = new GerritController(gerrit);

    commands.push(
        vscode.commands.registerCommand("gerrit.checkoutBranch", () => {
            vscode.window.showInformationMessage("Gerrit: Checkout branch");
            controller.checkoutBranch();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.checkoutRevision", () => {
            vscode.window.showInformationMessage("Gerrit: Checkout revision");
            controller.checkoutRevision();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.cherrypickRevision", () => {
            vscode.window.showInformationMessage("Gerrit: Cherrypick revision");
            controller.cherrypickRevision();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.commit", () => {
            vscode.window.showInformationMessage("Gerrit: Commit");
            controller.commit();
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
            controller.push();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.rebaseBranch", () => {
            vscode.window.showInformationMessage("Gerrit: Rebase from branch");
            controller.rebase();
        })
    );

    context.subscriptions.concat(commands);
}

export function deactivate() {
}

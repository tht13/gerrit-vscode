"use strict";
import * as vscode from "vscode";
import { Gerrit } from "./gerrit/gerrit";
import { GerritController } from "./gerrit/controller";

let gerrit: Gerrit;
let controller: GerritController;

export function activate(context: vscode.ExtensionContext) {
    let commands: vscode.Disposable[] = [];
    gerrit = new Gerrit(vscode.workspace.rootPath, "");
    controller = new GerritController(gerrit);

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
        vscode.commands.registerCommand("gerrit.cherrypickContinue", () => {
            vscode.window.showInformationMessage("Gerrit: Cherrypick continue");
            controller.cherrypickContinue();
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

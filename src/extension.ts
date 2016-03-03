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
        vscode.commands.registerCommand("gerrit.stageAll", () => {
            controller.stageAll();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.stageCurrentFile", () => {
            controller.stageCurrentFile();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.stageFile", () => {
            controller.stageFile();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.checkoutBranch", () => {
            controller.checkoutBranch();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.checkoutRevision", () => {
            controller.checkoutRevision();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.cherrypickRevision", () => {
            controller.cherrypickRevision();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.cherrypickContinue", () => {
            controller.cherrypickContinue();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.commit", () => {
            controller.commit();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.commitAmend", () => {
            controller.commitAmend();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.pushBranch", () => {
            controller.push();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.rebaseBranch", () => {
            controller.rebase();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.rebaseContinue", () => {
            controller.rebase();
        })
    );

    context.subscriptions.concat(commands);
}

export function deactivate() {
}

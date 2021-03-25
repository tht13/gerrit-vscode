"use strict";
import { isNil } from "lodash";
import * as vscode from "vscode";
import { Settings } from "./common/settings";
import { Controller } from "./controller";
import { FileServiceClient } from "./files/fileServiceClient";

let controller: Controller;

export function activate(context: vscode.ExtensionContext) {
    // needs testing as solution to tempest issue
    setTimeout(_activate, 2000, context);
}

function _activate(context: vscode.ExtensionContext) {
    let settings = Settings.getInstance();
    settings.extensionRoot = context.extensionPath;
    settings.workspaceRoot = vscode.workspace.rootPath;
    settings.loadSettings(vscode.workspace.getConfiguration("gerrit"));
    if (!isNil(settings.active) && !settings.active) {
        return;
    }
    vscode.workspace.onDidChangeConfiguration(() => settings.loadSettings(vscode.workspace.getConfiguration("gerrit")));

    let fileContainer = FileServiceClient.getInstance();
    context.subscriptions.push(fileContainer.startServer());

    let commands: vscode.Disposable[] = [];
    controller = new Controller();

    commands.push(
        vscode.commands.registerCommand("gerrit.stageAll", () => controller.stageAll())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.stageCurrentFile", () => controller.stageCurrentFile())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.stageFile", () => controller.stageFile())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.resetAll", () => controller.resetAll())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.resetCurrentFile", () => controller.resetCurrentFile())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.resetFile", () => controller.resetFile())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.cleanAll", () => controller.cleanAll())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.cleanCurrentFile", () => controller.cleanCurrentFile())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.checkoutBranch", () => controller.checkoutBranch())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.checkoutRevision", () => controller.checkoutRevision())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.cherrypickRevision", () => controller.cherrypickRevision())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.cherrypickContinue", () => controller.cherrypickContinue())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.commit", () => controller.commit())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.commitAmend", () => controller.commitAmend())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.pushBranch", () => controller.push())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.draftBranch", () => controller.draft())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.rebaseBranch", () => controller.rebase())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.rebaseContinue", () => controller.rebaseContinue())
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.log", () => controller.toggleLog())
    );

    context.subscriptions.concat(commands);
}

export function deactivate() {
}

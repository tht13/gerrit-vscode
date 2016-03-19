"use strict";
import * as vscode from "vscode";
import { Git } from "./common/git/git";
import { Controller } from "./controller";
import { GlobalFileContainerClient } from "./gerrit/files/globalFileContainerClient";
import { RequestEventType } from "./gerrit/files/globalFileContainerInterface";

let controller: Controller;

export function activate(context: vscode.ExtensionContext) {
    {
        GerritSettings.getInstance().extensionRoot = context.extensionPath;
        console.log("active");
        let fileContainer = GlobalFileContainerClient.getInstance();
        context.subscriptions.push(fileContainer.startServer());
        console.log("sending message");
        fileContainer.doRequest(RequestEventType.OPEN).then(value => {
            console.log(value.message);
        });
    }
    let commands: vscode.Disposable[] = [];
    controller = new Controller();

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
        vscode.commands.registerCommand("gerrit.resetAll", () => {
            controller.resetAll();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.resetCurrentFile", () => {
            controller.resetCurrentFile();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.resetFile", () => {
            controller.resetFile();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.cleanAll", () => {
            controller.cleanAll();
        })
    );
    commands.push(
        vscode.commands.registerCommand("gerrit.cleanCurrentFile", () => {
            controller.cleanCurrentFile();
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
            controller.rebaseContinue();
        })
    );

    context.subscriptions.concat(commands);
}

export function deactivate() {
}

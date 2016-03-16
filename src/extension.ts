"use strict";
import * as vscode from "vscode";
import { Gerrit, IGerrit } from "./gerrit/gerrit";
import { GerritController } from "./gerrit/controller";

let gerrit: IGerrit;
let controller: GerritController;

export function activate(context: vscode.ExtensionContext) {
    let commands: vscode.Disposable[] = [];
    gerrit = Gerrit;
    controller = new GerritController();

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

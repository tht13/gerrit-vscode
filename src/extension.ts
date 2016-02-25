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

class Ref {

    constructor(private id: number, private patchSet: number = 1) {
    }

    public getId(): number {
        return this.id;
    }

    public setId(id: number) {
        this.id = id;
    }

    public getPatchSet(): number {
        return this.patchSet;
    }

    public setPatchSet(patchSet: number) {
        this.patchSet = patchSet;
    }

}

class Gerrit {
    private currentRef: Ref;

    constructor(private workspace: string, private repo: string, ref: Ref = null) {
        if (ref !== null) {
            this.currentRef = ref;
        }
    }

    public getCurrentRef(): Ref {
        return this.currentRef;
    }

    public setCurrentRef(ref: Ref) {
        if (ref !== this.currentRef) {
            this.checkOutRef(ref);
        }
        this.currentRef = ref;
    }

    public commit(msg: string, files: string[], ammend: boolean) {

    }

    private isDirty(): boolean {

        return false;
    }

    private checkOutRef(ref?: Ref) {
        if (this.isDirty()) {
            return;
        }
        ref = (ref === undefined) ? this.currentRef : ref;
    }

    public push() {

    }
}

export function deactivate() {
}

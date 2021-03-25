import { QuickPickItem, window } from "vscode";
import * as fileCommon from "../files/common";

export interface FileStageQuickPick extends QuickPickItem, fileCommon.BasciFileQuickPick {
    path: string;
}

export interface BranchQuickPick extends QuickPickItem {
    branch: string;
}

export interface ChangeQuickPick extends QuickPickItem {
    change_id: number;
    change_number: number;
}

export interface PatchsetQuickPick extends QuickPickItem {
    patchset: number;
}

export function confirm(message: string): Thenable<boolean> {
    return window.showInformationMessage(message, "Yes", "No").then(value => value === "Yes");
}

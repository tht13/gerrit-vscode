import { QuickPickItem, window } from "vscode";
import * as utils from "./utils";

export interface FileStageQuickPick extends QuickPickItem {
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

export interface RejectReason {
    message: string;

    showInformation?: boolean;

    type: RejectType;

    attributes?: any;
}

export enum RejectType {
    DEFAULT,
    GIT,
    GET,
    NO_DIRTY
}

export function confirm(message: string): Thenable<boolean> {
    return window.showInformationMessage(message, "Yes", "No").then(value => {
        return value === "Yes";
    });
}

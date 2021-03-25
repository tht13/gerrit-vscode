import * as gitCommon from "../git/common";

export interface IFile {
    path: string;
    status: gitCommon.GitStatus;
    staged_type?: gitCommon.GitStagedType;
}

export interface IUpdateResult {
    status: gitCommon.GitStatus;
    container: IFile[];
}

export interface BasciFileQuickPick {
    path: string;
    label: string;
    description?: string;
}

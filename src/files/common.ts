import * as gitCommon from "../common/git/common";

export interface IFile {
    path: string;
    status: gitCommon.GitStatus;
}

export interface IUpdateResult {
    status: gitCommon.GitStatus;
    container: IFile[];
}

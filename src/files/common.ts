import * as gitCommon from "../git/common";

export interface IFile {
    path: string;
    status: gitCommon.GitStatus;
}

export interface IUpdateResult {
    status: gitCommon.GitStatus;
    container: IFile[];
}

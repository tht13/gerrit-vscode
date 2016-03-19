export interface IFile {
    path: string;
    status: GitStatus;
}

export interface IUpdateResult {
    status: GitStatus;
    container: IFile[];
}

export enum GitStatus {
    MODIFIED,
    DELETED,
    UNTRACKED,
    STAGED,
    CLEAN,
    DEFAULT
}

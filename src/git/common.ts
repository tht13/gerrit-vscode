export enum GitStatus {
    CLEAN,
    DELETED,
    MODIFIED,
    STAGED,
    STAGED_ADDED,
    STAGED_COPIED,
    STAGED_DELETED,
    STAGED_MODIFIED,
    STAGED_RENAMED,
    STAGED_TYPE,
    STAGED_UNKNOWN,
    STAGED_UNMERGED,
    UNTRACKED
}

export const GitStatedStatus: Map<string, GitStatus> = new Map<string, GitStatus>();
GitStatedStatus.set("A", GitStatus.STAGED_ADDED);
GitStatedStatus.set("C", GitStatus.STAGED_COPIED);
GitStatedStatus.set("M", GitStatus.STAGED_MODIFIED);
GitStatedStatus.set("R", GitStatus.STAGED_RENAMED);
GitStatedStatus.set("T", GitStatus.STAGED_TYPE);
GitStatedStatus.set("U", GitStatus.STAGED_UNMERGED);
GitStatedStatus.set("X", GitStatus.STAGED_UNKNOWN);

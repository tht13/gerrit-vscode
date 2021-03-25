export enum GitStatus {
    DELETED,
    MODIFIED,
    STAGED,
    UNTRACKED
}

export enum GitStagedType {
    ADDED,
    COPIED,
    DELETED,
    MODIFIED,
    RENAMED,
    TYPE,
    UNKNOWN,
    UNMERGED
}

export const GitStategTypeMap: Map<string, GitStagedType> = new Map<string, GitStagedType>();
GitStategTypeMap.set("A", GitStagedType.ADDED);
GitStategTypeMap.set("C", GitStagedType.COPIED);
GitStategTypeMap.set("M", GitStagedType.MODIFIED);
GitStategTypeMap.set("R", GitStagedType.RENAMED);
GitStategTypeMap.set("T", GitStagedType.TYPE);
GitStategTypeMap.set("U", GitStagedType.UNMERGED);
GitStategTypeMap.set("X", GitStagedType.UNKNOWN);

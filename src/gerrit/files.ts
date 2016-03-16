import * as utils from "../common/utils";
import * as common from "../common/common";

interface IFile {
    path: string;
}

enum GitStatus {
    MODIFIED,
    DELETED,
    UNTRACKED,
    STAGED,
    DEFAULT
}

export class FileContainer {
    private container: Map<GitStatus, IFile[]>;

    constructor() {
        this.container = new Map<GitStatus, IFile[]>();
    }

    protected addTypeContainer(type: GitStatus, container?: IFile[]) {
        container = utils.setDefault(container, []);
        this.container.set(type, container);
    }

    protected getTypeContainer(type: GitStatus): IFile[] {
        return this.container.get(type);
    }

    protected pushType(type: GitStatus, ...items: IFile[]) {
        for (let i in items) {
            this.container.get(type).push(items[i]);
        }
    }

    getFilePaths(): string[] {
        let paths: string[] = [];
        this.container.forEach((value, index, map) => {
            for (let i in value) {
                paths.push(value[i].path);
            }
        });
        return paths;
    }

    protected removeByPath(container: common.FileStageQuickPick[], path: string): common.FileStageQuickPick[] {
        container = container.filter((value, index, array) => {
            return value.path !== path;
        });
        return container;
    }

    get length(): number {
        let count = 0;
        this.container.forEach((value, index, map) => {
            count += value.length;
        });
        return count;
    }
}

export class DirtyFileContainter extends FileContainer {

    constructor() {
        super();
        this.addTypeContainer(GitStatus.MODIFIED);
        this.addTypeContainer(GitStatus.DELETED);
        this.addTypeContainer(GitStatus.UNTRACKED);
    }

    addModified(file: IFile) {
        this.pushType(GitStatus.MODIFIED, file);
    }

    addDeleted(file: IFile) {
        this.pushType(GitStatus.DELETED, file);
    }

    addUntrackedFile(file: IFile) {
        this.pushType(GitStatus.UNTRACKED, file);
    }

    getDescriptors(): common.FileStageQuickPick[] {
        let descriptors: common.FileStageQuickPick[] = [];

        let modifiedFiles = this.getTypeContainer(GitStatus.MODIFIED);
        for (let i in modifiedFiles) {
            descriptors.push({
                label: modifiedFiles[i].path,
                path: modifiedFiles[i].path,
                description: "Modified"
            });
        }
        let deletedFiles = this.getTypeContainer(GitStatus.DELETED);
        for (let i in deletedFiles) {
            descriptors = this.removeByPath(descriptors, deletedFiles[i].path);
            descriptors.push({
                label: deletedFiles[i].path,
                path: deletedFiles[i].path,
                description: "Deleted"
            });
        }
        let untrackedFiles = this.getTypeContainer(GitStatus.UNTRACKED);
        for (let i in untrackedFiles) {
            descriptors.push({
                label: untrackedFiles[i].path,
                path: untrackedFiles[i].path,
                description: "Untracked"
            });
        }
        return descriptors;
    }

    isDirty(): boolean {
        return this.getTypeContainer(GitStatus.MODIFIED).length +
            this.getTypeContainer(GitStatus.DELETED).length !== 0;
    }
}

export class StagedFileContainter extends FileContainer {

    constructor() {
        super();
        this.addTypeContainer(GitStatus.STAGED);
    }

    addStaged(file: IFile) {
        this.pushType(GitStatus.STAGED, file);
    }

    getDescriptors(): common.FileStageQuickPick[] {
        let descriptors: common.FileStageQuickPick[] = [];

        let stagedFiles = this.getTypeContainer(GitStatus.STAGED);
        for (let i in stagedFiles) {
            descriptors.push({
                label: stagedFiles[i].path,
                path: stagedFiles[i].path,
                description: "Staged"
            });
        }
        return descriptors;
    }
}

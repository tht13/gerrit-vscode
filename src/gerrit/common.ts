import { QuickPickItem } from "vscode";

export interface FileStageQuickPick extends QuickPickItem, DirtyFile {
    path: string;
}

interface DirtyFile {
    path: string;
}

interface ModifiedFile extends DirtyFile {
}

interface DeletedFile extends DirtyFile {
}

interface UntrackedFile extends DirtyFile {
}

export class DirtyFilesContainter {
    private modifiedFiles: ModifiedFile[];
    private deletedFiles: DeletedFile[];
    private untrackedFiles: UntrackedFile[];

    constructor() {
        this.modifiedFiles = [];
        this.deletedFiles = [];
        this.untrackedFiles = [];
    }

    addModified(file: ModifiedFile) {
        this.modifiedFiles.push(file);
    }

    addDeleted(file: DeletedFile) {
        this.deletedFiles.push(file);
    }

    addUntrackedFile(file: UntrackedFile) {
        this.untrackedFiles.push(file);
    }

    getFilePaths(): string[] {
        let paths: string[] = [];
        let joined: DirtyFile[] = this.modifiedFiles.concat(this.deletedFiles, this.untrackedFiles);
        for (let i in joined) {
            paths.push(joined[i].path);
        }
        return paths;
    }

    private removeByPath(container: FileStageQuickPick[], path: string): FileStageQuickPick[] {
        container = container.filter((value, index, array) => {
            return value.path !== path;
        });
        return container;
    }

    getDescriptors(): FileStageQuickPick[] {
        let descriptors: FileStageQuickPick[] = [];
        for (let i in this.modifiedFiles) {
            descriptors.push({
                label: this.modifiedFiles[i].path,
                path: this.modifiedFiles[i].path,
                description: "Modified"
            });
        }
        for (let i in this.deletedFiles) {
            descriptors = this.removeByPath(descriptors, this.deletedFiles[i].path);
            descriptors.push({
                label: this.deletedFiles[i].path,
                path: this.deletedFiles[i].path,
                description: "Deleted"
            });
        }
        for (let i in this.untrackedFiles) {
            descriptors.push({
                label: this.untrackedFiles[i].path,
                path: this.untrackedFiles[i].path,
                description: "Untracked"
            });
        }
        return descriptors;
    }

    get length(): number {
        return this.deletedFiles.length + this.untrackedFiles.length + this.modifiedFiles.length;
    }
}

export interface RejectReason {
    message: string;

    showInformation?: boolean;

    type: RejectType;

    attributes?: {};
}

export enum RejectType {
    DEFAULT,
    GIT,
    GET,
    NO_DIRTY
}
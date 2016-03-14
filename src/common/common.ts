import { QuickPickItem, window } from "vscode";
import * as utils from "./utils";

export interface FileStageQuickPick extends QuickPickItem, File {
    path: string;
}

export interface BranchQuickPick extends QuickPickItem {
    branch: string;
}

interface File {
    path: string;
}

export class FileContainer {
    private container: Map<FileTypes, File[]>;

    constructor() {
        this.container = new Map<FileTypes, File[]>();
    }

    protected addTypeContainer(type: FileTypes, container?: File[]) {
        container = utils.setDefault(container, []);
        this.container.set(type, container);
    }

    protected getTypeContainer(type: FileTypes): File[] {
        return this.container.get(type);
    }

    protected pushType(type: FileTypes, ...items: File[]) {
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

    protected removeByPath(container: FileStageQuickPick[], path: string): FileStageQuickPick[] {
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

enum FileTypes {
    MODIFIED,
    DELETED,
    UNTRACKED,
    STAGED,
    DEFAULT
}

export class DirtyFileContainter extends FileContainer {

    constructor() {
        super();
        this.addTypeContainer(FileTypes.MODIFIED);
        this.addTypeContainer(FileTypes.DELETED);
        this.addTypeContainer(FileTypes.UNTRACKED);
    }

    addModified(file: File) {
        this.pushType(FileTypes.MODIFIED, file);
    }

    addDeleted(file: File) {
        this.pushType(FileTypes.DELETED, file);
    }

    addUntrackedFile(file: File) {
        this.pushType(FileTypes.UNTRACKED, file);
    }

    getDescriptors(): FileStageQuickPick[] {
        let descriptors: FileStageQuickPick[] = [];

        let modifiedFiles = this.getTypeContainer(FileTypes.MODIFIED);
        for (let i in modifiedFiles) {
            descriptors.push({
                label: modifiedFiles[i].path,
                path: modifiedFiles[i].path,
                description: "Modified"
            });
        }
        let deletedFiles = this.getTypeContainer(FileTypes.DELETED);
        for (let i in deletedFiles) {
            descriptors = this.removeByPath(descriptors, deletedFiles[i].path);
            descriptors.push({
                label: deletedFiles[i].path,
                path: deletedFiles[i].path,
                description: "Deleted"
            });
        }
        let untrackedFiles = this.getTypeContainer(FileTypes.UNTRACKED);
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
        return this.getTypeContainer(FileTypes.MODIFIED).length +
            this.getTypeContainer(FileTypes.DELETED).length !== 0;
    }
}

export class StagedFileContainter extends FileContainer {

    constructor() {
        super();
        this.addTypeContainer(FileTypes.STAGED);
    }

    addStaged(file: File) {
        this.pushType(FileTypes.STAGED, file);
    }

    getDescriptors(): FileStageQuickPick[] {
        let descriptors: FileStageQuickPick[] = [];

        let stagedFiles = this.getTypeContainer(FileTypes.STAGED);
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

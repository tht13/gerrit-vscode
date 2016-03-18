import * as utils from "../../common/utils";
import * as common from "../../common/common";

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

export class FileContainer {
    private container: Map<string, IFile>;

    constructor() {
        this.container = new Map();
    }

    add(item: IFile) {
        this.container.set(item.path, item);
    }

    push(items: IFile[]) {
        for (let i in items) {
            this.add(items[i]);
        }
    }

    clear() {
        this.container.clear();
    }

    getFilePaths(): string[] {
        let paths: string[] = [];
        this.container.forEach((value, index, array) => {
            for (let i in value) {
                paths.push(value[i].path);
            }
        });
        return paths;
    }

    private removeByPath(container: common.FileStageQuickPick[], path: string): common.FileStageQuickPick[] {
        container = container.filter((value, index, array) => {
            return value.path !== path;
        });
        return container;
    }

    get length(): number {
        return this.container.size;
    }

    lengthOfType(type: GitStatus[]) {
        return this.getByType(type).size;
    }

    getByType(type: GitStatus[]) {
        let subset: Set<IFile> = new Set();
        this.container.forEach((value, index, map) => {
            if (type.indexOf(value.status) > -1) {
                subset.add(value);
            }
        });
        return subset;
    }

    getDescriptorsAll(): common.FileStageQuickPick[] {
        let descriptors: common.FileStageQuickPick[] = [];
        for (let status in GitStatus) {
            let files = this.getByType([GitStatus.MODIFIED]);
            for (let i in files) {
                descriptors.push({
                    label: files[i].path,
                    path: files[i].path,
                    description: status
                });
            }
        }
        return descriptors;
    }

    getDescriptorsByType(type: GitStatus[]): common.FileStageQuickPick[] {
        let descriptors: common.FileStageQuickPick[] = [];
        for (let status in type) {
            let files = this.getByType([type[status]]);
            for (let i in files) {
                descriptors.push({
                    label: files[i].path,
                    path: files[i].path,
                    description: status
                });
            }
        }
        return descriptors;
    }

    isDirty(): boolean {
        return this.lengthOfType([GitStatus.MODIFIED, GitStatus.DELETED]) !== 0;
    }
}

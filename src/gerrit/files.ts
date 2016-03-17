import * as utils from "../common/utils";
import * as common from "../common/common";
import { Git, IGit } from "./git";

interface IFile {
    path: string;
    status: GitStatus;
}

interface IUpdateResult {
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
    // TODO: revert to Map<IFile, Status>
    private container: Set<IFile>;

    constructor() {
        this.container = new Set();
    }

    push(...items: IFile[]) {
        for (let i in items) {
            this.container.add(items[i]);
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

    lengthOfType(...type: GitStatus[]) {
        return this.getByType(...type).size;
    }

    getByType(...type: GitStatus[]) {
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
            let files = this.getByType(GitStatus.MODIFIED);
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

    getDescriptorsByType(...type: GitStatus[]): common.FileStageQuickPick[] {
        let descriptors: common.FileStageQuickPick[] = [];
        for (let status in type) {
            let files = this.getByType(type[status]);
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
        return this.lengthOfType(GitStatus.MODIFIED, GitStatus.DELETED) !== 0;
    }
}

// TODO: Make GlobalFileContainer singleton
export class GlobalFileContainer extends FileContainer {
    private git: IGit;


    constructor() {
        super();
        this.git = Git;
    }

    updateFiles() {
        let find = (values: IUpdateResult[], search: GitStatus) => {
            return values.find((value, index, obj) => {
                return (value.status === search);
            });
        };
        return Promise.all([
            this.updateIndex(),
            this.updateModified(),
            this.updateDeleted(),
            this.updateUntracked(),
            // TODO: add staged, as this is the only type which could be a second property of a file
            // this.updateStaged()
        ]).then(values => {
            this.clear();
            this.push(...find(values, GitStatus.CLEAN).container);
            this.push(...find(values, GitStatus.DELETED).container);
            this.push(...find(values, GitStatus.MODIFIED).container);
            this.push(...find(values, GitStatus.UNTRACKED).container);
        });
    }

    private updateIndex() {
        return this.updateType(GitStatus.CLEAN);
    }

    private updateModified() {
        return this.updateType(GitStatus.MODIFIED, ["--exclude-standard", "-m"]);
    }

    private updateDeleted() {
        return this.updateType(GitStatus.DELETED, ["--exclude-standard", "-d"]);
    }

    private updateUntracked() {
        return this.updateType(GitStatus.UNTRACKED, ["--exclude-standard", "-o"]);
    }

    private updateType(type: GitStatus, options?: string[], command?: string) {
        return this.git.ls_files(options).then(value => {
            let container: IFile[] = [];
            let files: string[] = value.split(utils.SPLIT_LINE);
            for (let i in files) {
                if (files[i] === "") {
                    continue;
                }
                container.push({
                    path: files[i],
                    status: type
                });
            }
            return { status: type, container: container };
        });
    }

    private updateStaged() {
        return this.git.diff([], ["--name-only", "--cached"]).then(value => {
            let container: IFile[] = [];
            let files: string[] = value.split(utils.SPLIT_LINE);
            for (let i in files) {
                if (files[i] === "") {
                    continue;
                }
                container.push({
                    path: files[i],
                    status: GitStatus.CLEAN
                });
            }
            return { status: GitStatus.CLEAN, container: container };
        });
    }
}

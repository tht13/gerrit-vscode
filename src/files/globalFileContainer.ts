import { BasicFileContainer } from "./basicFileContainer";
import * as common from "./common";
import { BasicGit } from "../common/git/basicGit";
import * as gitCommon from "../common/git/common";
import * as utils from "../common/utils";

// TODO: Make GlobalFileContainer singleton
export class GlobalFileContainer extends BasicFileContainer {
    private git: BasicGit;


    constructor() {
        super();
        this.git = BasicGit.getInstance();
    }

    updateFiles() {
        let find = (values: common.IUpdateResult[], search: gitCommon.GitStatus) => {
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
            this.push(find(values, gitCommon.GitStatus.CLEAN).container);
            this.push(find(values, gitCommon.GitStatus.DELETED).container);
            this.push(find(values, gitCommon.GitStatus.MODIFIED).container);
            this.push(find(values, gitCommon.GitStatus.UNTRACKED).container);
        });
    }

    private updateIndex(): Promise<common.IUpdateResult> {
        return this.updateType(gitCommon.GitStatus.CLEAN);
    }

    private updateModified(): Promise<common.IUpdateResult> {
        return this.updateType(gitCommon.GitStatus.MODIFIED, ["--exclude-standard", "-m"]);
    }

    private updateDeleted(): Promise<common.IUpdateResult> {
        return this.updateType(gitCommon.GitStatus.DELETED, ["--exclude-standard", "-d"]);
    }

    private updateUntracked(): Promise<common.IUpdateResult> {
        return this.updateType(gitCommon.GitStatus.UNTRACKED, ["--exclude-standard", "-o"]);
    }

    private updateType(type: gitCommon.GitStatus, options?: string[], command?: string): Promise<common.IUpdateResult> {
        return this.git.ls_files(options).then(value => {
            let container: common.IFile[] = [];
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

    private updateStaged(): Promise<common.IUpdateResult> {
        return this.git.diff([], ["--name-only", "--cached"]).then(value => {
            let container: common.IFile[] = [];
            let files: string[] = value.split(utils.SPLIT_LINE);
            for (let i in files) {
                if (files[i] === "") {
                    continue;
                }
                container.push({
                    path: files[i],
                    status: gitCommon.GitStatus.CLEAN
                });
            }
            return { status: gitCommon.GitStatus.CLEAN, container: container };
        });
    }
}

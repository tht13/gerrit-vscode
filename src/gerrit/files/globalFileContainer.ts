import * as utils from "../../common/utils";
import { Git } from "../../common/git/git";
import { FileContainer, GitStatus, IUpdateResult, IFile } from "./fileContainer";

// TODO: Make GlobalFileContainer singleton
export class GlobalFileContainer extends FileContainer {
    private git: Git;


    constructor() {
        super();
        this.git = Git.getInstance();
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
            this.push(find(values, GitStatus.CLEAN).container);
            this.push(find(values, GitStatus.DELETED).container);
            this.push(find(values, GitStatus.MODIFIED).container);
            this.push(find(values, GitStatus.UNTRACKED).container);
        });
    }

    private updateIndex(): Promise<IUpdateResult> {
        return this.updateType(GitStatus.CLEAN);
    }

    private updateModified(): Promise<IUpdateResult> {
        return this.updateType(GitStatus.MODIFIED, ["--exclude-standard", "-m"]);
    }

    private updateDeleted(): Promise<IUpdateResult> {
        return this.updateType(GitStatus.DELETED, ["--exclude-standard", "-d"]);
    }

    private updateUntracked(): Promise<IUpdateResult> {
        return this.updateType(GitStatus.UNTRACKED, ["--exclude-standard", "-o"]);
    }

    private updateType(type: GitStatus, options?: string[], command?: string): Promise<IUpdateResult> {
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

    private updateStaged(): Promise<IUpdateResult> {
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

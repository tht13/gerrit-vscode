import * as utils from "../../common/utils";
import { BasicGit } from "../../git/basicGit";
import * as gitCommon from "../../git/common";
import { BasicFileContainer } from "../basicFileContainer";
import * as fileCommon from "../common";

export class FileService extends BasicFileContainer {
    private git: BasicGit;

    constructor() {
        super();
        this.git = BasicGit.getInstance();
    }

    updateFiles() {
        let filter = (values: fileCommon.IUpdateResult[], search: gitCommon.GitStatus) =>
            values.find((value, index, obj) => (value.status === search));
        return Promise.all([
            this.updateModified(),
            this.updateDeleted(),
            this.updateUntracked(),
            this.updateStaged()
        ]).then(values => {
            this.clear();
            this.push(filter(values, gitCommon.GitStatus.DELETED).container);
            this.push(filter(values, gitCommon.GitStatus.MODIFIED).container);
            this.push(filter(values, gitCommon.GitStatus.UNTRACKED).container);
            this.push(filter(values, gitCommon.GitStatus.STAGED).container);
        });
    }

    private updateModified(): Promise<fileCommon.IUpdateResult> {
        return this.updateType(gitCommon.GitStatus.MODIFIED, ["--exclude-standard", "-m"]);
    }

    private updateDeleted(): Promise<fileCommon.IUpdateResult> {
        return this.updateType(gitCommon.GitStatus.DELETED, ["--exclude-standard", "-d"]);
    }

    private updateUntracked(): Promise<fileCommon.IUpdateResult> {
        return this.updateType(gitCommon.GitStatus.UNTRACKED, ["--exclude-standard", "-o"]);
    }

    private updateStaged(): Promise<fileCommon.IUpdateResult> {
        return this.updateType(gitCommon.GitStatus.STAGED, ["--name-status", "--cached"]);
    }

    private updateType(status: gitCommon.GitStatus, options?: string[]): Promise<fileCommon.IUpdateResult> {
        let value: Promise<string>;
        switch (status) {
            case gitCommon.GitStatus.STAGED:
                value = this.git.diff(options);
                break;
            case gitCommon.GitStatus.MODIFIED:
            case gitCommon.GitStatus.DELETED:
            case gitCommon.GitStatus.UNTRACKED:
                value = this.git.ls_files(options);
        }
        return value.then(value => this.parseUpdate(value, status));
    }

    private parseUpdate(value: string, status: gitCommon.GitStatus): fileCommon.IUpdateResult {
        let container: fileCommon.IFile[] = [];
        let files: string[] = value.split(utils.SPLIT_LINE);
        for (let i in files) {
            if (files[i] === "") {
                continue;
            }
            switch (status) {
                case gitCommon.GitStatus.STAGED:
                    let [type, filePath] = files[i].split(/\t/);
                    container.push({
                        path: filePath,
                        status: status,
                        staged_type: gitCommon.GitStategTypeMap.get(type)
                    });
                    break;
                default:
                    container.push({
                        path: files[i],
                        status: status
                    });
            }
        }
        return { status: status, container: container };
    }

    getDescriptorsByType(type: gitCommon.GitStatus[]): fileCommon.BasciFileQuickPick[] {
        let descriptors: fileCommon.BasciFileQuickPick[] = [];
        for (let status in type) {
            let files = this.getByType([type[status]]);
            files.forEach((value, index, map) =>
                descriptors.push({
                    label: value.path,
                    path: value.path,
                    description: (value.status === gitCommon.GitStatus.STAGED) ?
                        gitCommon.GitStagedType[value.staged_type] :
                        gitCommon.GitStatus[value.status]
                })
            );
        }
        return descriptors;
    }
}

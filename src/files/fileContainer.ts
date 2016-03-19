import { BasicFileContainer } from "./basicFileContainer";
import * as common from "./common";
import * as utils from "../common/utils";
import * as view from "../view/common";

export class FileContainer extends BasicFileContainer {

    constructor() {
        super();
    }

    getDescriptorsAll(): view.FileStageQuickPick[] {
        let descriptors: view.FileStageQuickPick[] = [];
        for (let status in common.GitStatus) {
            let files = this.getByType([common.GitStatus.MODIFIED]);
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

    getDescriptorsByType(type: common.GitStatus[]): view.FileStageQuickPick[] {
        let descriptors: view.FileStageQuickPick[] = [];
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
        return this.lengthOfType([common.GitStatus.MODIFIED, common.GitStatus.DELETED]) !== 0;
    }
}

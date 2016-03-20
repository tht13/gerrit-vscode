import { BasicFileContainer } from "./basicFileContainer";
import * as fileCommon from "./common";
import * as gitCommon from "../git/common";
import * as utils from "../common/utils";
import * as view from "../view/common";

export class FileContainer extends BasicFileContainer {

    constructor() {
        super();
    }

    getDescriptorsAll(): view.FileStageQuickPick[] {
        let descriptors: view.FileStageQuickPick[] = [];
        for (let status in gitCommon.GitStatus) {
            let files = this.getByType([gitCommon.GitStatus.MODIFIED]);
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

    getDescriptorsByType(type: gitCommon.GitStatus[]): view.FileStageQuickPick[] {
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
}

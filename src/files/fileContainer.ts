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
        return <view.FileStageQuickPick[]>super.getDescriptorsAll();
    }

    getDescriptorsByType(type: gitCommon.GitStatus[]): view.FileStageQuickPick[] {
        let descriptors: view.FileStageQuickPick[] = [];
        for (let status in type) {
            let files = this.getByType([type[status]]);
            for (let i in files) {
                descriptors.push({
                    label: files.get(i).path,
                    path: files.get(i).path,
                    description: status
                });
            }
        }
        return descriptors;
    }
}

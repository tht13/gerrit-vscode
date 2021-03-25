import * as gitCommon from "../git/common";
import * as view from "../view/common";
import { BasicFileContainer } from "./basicFileContainer";

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
            files.forEach((value, index, map) =>
                descriptors.push({
                    label: value.path,
                    path: value.path,
                    description: gitCommon.GitStatus[value.status]
                })
            );
        }
        return descriptors;
    }
}

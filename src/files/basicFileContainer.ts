import * as common from "./common";
import * as utils from "../common/utils";


export abstract class BasicFileContainer {
    protected container: Map<string, common.IFile>;

    constructor() {
        this.container = new Map();
    }

    add(item: common.IFile) {
        this.container.set(item.path, item);
    }

    push(items: common.IFile[]) {
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

    get length(): number {
        return this.container.size;
    }

    lengthOfType(type: common.GitStatus[]) {
        return this.getByType(type).size;
    }

    getByType(type: common.GitStatus[]) {
        let subset: Map<string, common.IFile> = new Map();
        this.container.forEach((value, index, map) => {
            if (type.indexOf(value.status) > -1) {
                subset.set(index, value);
            }
        });
        return subset;
    }

    isDirty(): boolean {
        return this.lengthOfType([common.GitStatus.MODIFIED, common.GitStatus.DELETED]) !== 0;
    }
}

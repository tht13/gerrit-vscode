import * as fileCommon from "./common";
import * as gitCommon from "../common/git/common";
import * as utils from "../common/utils";


export abstract class BasicFileContainer {
    protected container: Map<string, fileCommon.IFile>;

    constructor() {
        this.container = new Map();
    }

    add(item: fileCommon.IFile) {
        this.container.set(item.path, item);
    }

    push(items: fileCommon.IFile[]) {
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

    lengthOfType(type: gitCommon.GitStatus[]) {
        return this.getByType(type).size;
    }

    getByType(type: gitCommon.GitStatus[]) {
        let subset: Map<string, fileCommon.IFile> = new Map();
        this.container.forEach((value, index, map) => {
            if (type.indexOf(value.status) > -1) {
                subset.set(index, value);
            }
        });
        return subset;
    }

    isDirty(): boolean {
        return this.lengthOfType([gitCommon.GitStatus.MODIFIED, gitCommon.GitStatus.DELETED]) !== 0;
    }
}

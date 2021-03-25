const hash = require("object-hash");
import * as gitCommon from "../git/common";
import * as fileCommon from "./common";


export abstract class BasicFileContainer {
    protected container: Map<string, fileCommon.IFile>;

    constructor() {
        this.container = new Map();
    }

    add(item: fileCommon.IFile) {
        let hash_key = hash(item);
        this.container.set(hash_key, item);
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
        this.container.forEach((value, index, array) => paths.push(value.path));
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

    getDescriptorsAll(): fileCommon.BasciFileQuickPick[] {
        let descriptors: fileCommon.BasciFileQuickPick[] = [];
        this.container.forEach((value, index, map) =>
            descriptors.push({
                label: value.path,
                path: value.path,
                description: gitCommon.GitStatus[value.status]
            })
        );
        return descriptors;
    }
}

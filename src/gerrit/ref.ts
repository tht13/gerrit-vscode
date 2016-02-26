import { Logger } from "./logger";

export class Ref {
    private logger: Logger;

    constructor(private id: number, private patchSet: number = 1) {
        this.logger = Logger.logger;
    }

    public getId(): number {
        return this.id;
    }

    public setId(id: number) {
        this.id = id;
    }

    public getPatchSet(): number {
        return this.patchSet;
    }

    public setPatchSet(patchSet: number) {
        this.patchSet = patchSet;
    }

    public getUrl(): string {
        return "";
    }

}
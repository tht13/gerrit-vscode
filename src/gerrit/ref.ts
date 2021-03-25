import { Logger } from "../view/logger";

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
        let idString = this.id.toString();
        let shortId: string;
        if (idString.length > 1) {
            shortId = idString.substr(idString.length - 2);
        } else {
            shortId = idString;
        }
        return `refs/changes/${shortId}/${idString}/${this.patchSet.toString()}`;
    }

    public get text(): string {
        return `${this.id}/${this.patchSet}`;
    }
}

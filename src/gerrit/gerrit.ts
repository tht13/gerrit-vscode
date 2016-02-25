import { Ref } from "./ref";

export class Gerrit {
    private currentRef: Ref;

    constructor(private workspace: string, private repo: string, ref: Ref = null) {
        if (ref !== null) {
            this.currentRef = ref;
        }
    }

    public getCurrentRef(): Ref {
        return this.currentRef;
    }

    public setCurrentRef(ref: Ref) {
        if (ref !== this.currentRef) {
            this.checkOutRef(ref);
        }
        this.currentRef = ref;
    }

    public commit(msg: string, files: string[], ammend: boolean) {

    }

    private isDirty(): boolean {

        return false;
    }

    private checkOutRef(ref?: Ref) {
        if (this.isDirty()) {
            return;
        }
        ref = (ref === undefined) ? this.currentRef : ref;
    }

    public push() {

    }
}
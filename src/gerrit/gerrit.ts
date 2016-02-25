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
            this.checkoutRef(ref);
        }
        this.currentRef = ref;
    }

    public commit(msg: string, files: string[], ammend: boolean) {

    }

    private isDirty(): boolean {

        return false;
    }

    private checkoutRef(ref?: Ref) {
        if (this.isDirty()) {
            return;
        }
        ref = (ref === undefined) ? this.currentRef : ref;
        this.fetch(ref.getUrl());
        // THEN
        this.checkout("FETCH_HEAD");
    }

    private fetch(url: string) {

    }

    private checkout(HEAD: string) {

    }
    public push() {

    }
}
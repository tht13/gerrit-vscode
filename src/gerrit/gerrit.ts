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

    // TODO: commit should return Promise
    public commit(msg: string, files: string[], ammend: boolean) {

    }

    // TODO: isDirty maybe return Promise?
    private isDirty(): boolean {

        return false;
    }

    public checkoutBranch(branch: string) {
        this.checkout("origin/" + branch);
    }

    // TODO: checkout should return Promise
    private checkoutRef(ref?: Ref) {
        if (this.isDirty()) {
            return;
        }
        ref = (ref === undefined) ? this.currentRef : ref;
        this.fetch(ref.getUrl());
        // THEN
        this.checkout("FETCH_HEAD");
    }

    // TODO: fetch should return Promise
    private fetch(url: string) {

    }

    // TODO: checkout should return Promise
    private checkout(HEAD: string) {

    }

    // TODO: push should return Promise
    public push() {

    }
}
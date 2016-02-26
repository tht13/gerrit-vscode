import { Ref } from "./ref";
import { Logger } from "./logger";

export class Gerrit {
    private branch: string;
    private currentRef: Ref;
    private logger: Logger;

    constructor(private workspace: string, private repo: string, ref: Ref = null) {
        this.logger = Logger.logger;
        if (ref !== null) {
            this.currentRef = ref;
        }
    }

    public getCurrentRef(): Ref {
        return this.currentRef;
    }

    private setCurrentRef(ref: Ref) {
        this.currentRef = ref;
    }

    public commit(msg: string, files: string[], ammend: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    // TODO: isDirty maybe return Promise?
    private isDirty(): boolean {

        return false;
    }

    public checkoutBranch(branch: string): Promise<boolean> {
        this.branch = branch;
        return this.checkout("origin/" + branch);
    }

    public checkoutRef(ref: Ref): Promise<boolean> {
        return this.fetchRef(ref, this.checkout);
    }

    public cherrypickRef(ref: Ref): Promise<boolean> {
        return this.fetchRef(ref, this.cherrypick);
    }

    private fetchRef(ref: Ref, resolver: (url: string) => Promise<boolean>): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.isDirty()) {
                reject("Dirty");
            }

            this.setCurrentRef(ref);

            resolver(ref.getUrl()).then(value => {
                this.cherrypick("FETCH_HEAD").then(value => {
                    resolve(true);
                }, reason => {
                    reject(reason);
                });
            }, reason => {
                reject(reason);
            });
        });
    }

    private fetch(url: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    private checkout(HEAD: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    private cherrypick(HEAD: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    public push(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    public rebase(branch: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let url = "" + branch;
            this.fetch(url).then(value => {
                resolve(true);
            }, reason => {
                reject(reason);
            });
        });
    }
}
import { Gerrit } from "./gerrit";
import { Ref } from "./ref";

export class GerritController {

    constructor(private gerrit: Gerrit) {
    }

    public checkoutBranch() {

        this.gerrit.checkoutBranch("master");
    }

    public checkoutRevision() {
        let newRef: Ref = new Ref(0, 0);
        this.gerrit.setCurrentRef(newRef);
    }

    public commitAmend() {

        this.gerrit.commit("", [""], true);
    }

    public commit() {

        this.gerrit.commit("", [""], false);
    }
}
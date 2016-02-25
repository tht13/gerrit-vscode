import { window, InputBoxOptions } from "vscode";
import { Gerrit } from "./gerrit";
import { Ref } from "./ref";

export class GerritController {

    constructor(private gerrit: Gerrit) {
    }

    public checkoutBranch() {
        let options: InputBoxOptions = {
            value: "master",
            prompt: "The branch to checkout"
        };

        window.showInputBox(options).then(branch => {
            this.gerrit.checkoutBranch(branch);
        }, reason => {
        });
    }

    public checkoutRevision() {
        let revisionOptions: InputBoxOptions = {
            placeHolder: "Ref Number",
            validateInput: (value: string): string => {
                if (isNaN(parseInt(value))) {
                    return "Not a Number";
                } else {
                    return null;
                }
            },
            prompt: "The revision to checkout"
        };

        window.showInputBox(revisionOptions).then(refString => {
            let refId = parseInt(refString);
            let patchsetOptions: InputBoxOptions = revisionOptions;
            patchsetOptions.placeHolder = `Patchset for Ref: ${refString}`;
            patchsetOptions.prompt = "The patchset to checkout";

            window.showInputBox(patchsetOptions).then(patchString => {
                let patchId = parseInt(patchString);
                let newRef: Ref = new Ref(refId, patchId);
                this.gerrit.setCurrentRef(newRef);
            }, reason => {
            });
        }, reason => {
        });
    }

    public commitAmend() {
        // TODO: should not require new commit message
        this.gerrit.commit("", [""], true);
    }

    public commit() {
        let options: InputBoxOptions = {
            placeHolder: "Commit Message",
            prompt: "The commit description"
        };

        window.showInputBox(options).then(message => {
            this.gerrit.commit(message, [""], false);
        }, reason => {
        });
    }

    public push() {
        this.gerrit.push();
    }
}
import { window, workspace, InputBoxOptions,
    StatusBarItem, StatusBarAlignment } from "vscode";
import { Gerrit } from "./gerrit";
import { Ref } from "./ref";
import { Logger } from "./logger";
import * as utils from "./utils";
import * as common from "./common";
import { Event } from "./event";
import * as path from "path";

export class GerritController {
    private logger: Logger;
    // private statusBarItem: StatusBarItem;
    private lock: boolean;

    constructor(private gerrit: Gerrit) {
        this.logger = Logger.logger;
        this.lock = false;
        // this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 10);
        // this.statusBarItem.command = "gerrit.checkoutRevision";
        // this.updateStatusBarItem();
        Event.event.on("ref.change", this.updateStatusBarItem);
    }

    private updateStatusBarItem() {
        // if (utils.isNull(this.gerrit.getCurrentRef())) {
        //     this.statusBarItem.hide();
        // } else {
        //     this.statusBarItem.text = this.gerrit.getCurrentRef().text;
        //     this.statusBarItem.show();
        // }
    }

    public stageAll() {
        this.aquireLock(this.gerrit, this.gerrit.stage, ["."]);
    }

    public stageCurrentFile() {
        let path: string = window.activeTextEditor.document.fileName;
        this.aquireLock(this.gerrit, this.gerrit.stage, [path]);
    }

    public stageFile() {
        window.showQuickPick<common.FileStageQuickPick>(new Promise<common.FileStageQuickPick[]>((resolve, reject) => {
            this.aquireLock(this.gerrit, this.gerrit.getDirtyFiles).then(value => {
                if (value.length === 0) {
                    let reason: common.RejectReason = {
                        showInformation: true,
                        message: "No files to stage",
                        type: common.RejectType.NO_DIRTY
                    };
                    reject(reason);
                }
                resolve(value.getDescriptors());
            }, reason => {
                reject(reason);
            });
        }), { placeHolder: "File to stage" }).then(value => {
            if (value === undefined) {
                return;
            }
            let filePath = path.join(workspace.rootPath, value.path);
            this.aquireLock(this.gerrit, this.gerrit.stage, [filePath]).then(value => {
            }, reason => {
            });
        }, (reason: common.RejectReason) => {
            // TODO: handle exception thrown here 
            if (reason.type === common.RejectType.NO_DIRTY && reason.showInformation) {
                window.showInformationMessage(reason.message);
            }
        });
    }

    public resetAll() {
        this.aquireLock(this.gerrit, this.gerrit.reset, [".", false]);
    }

    // TODO: need to check is valid path, f.exs if in git diff mode then invalid file path is given (can also apply to other functions)
    public resetCurrentFile() {
        let path: string = window.activeTextEditor.document.fileName;
        this.aquireLock(this.gerrit, this.gerrit.reset, [path, false]);
    }

    public resetFile() {
        window.showQuickPick<common.FileStageQuickPick>(new Promise<common.FileStageQuickPick[]>((resolve, reject) => {
            this.aquireLock(this.gerrit, this.gerrit.getStagedFiles).then(value => {
                if (value.length === 0) {
                    let reason: common.RejectReason = {
                        showInformation: true,
                        message: "No staged files",
                        type: common.RejectType.NO_DIRTY
                    };
                    reject(reason);
                }
                resolve(value.getDescriptors());
            }, reason => {
                reject(reason);
            });
        }), { placeHolder: "File to reset" }).then(value => {
            if (value === undefined) {
                return;
            }
            let filePath: string = path.join(workspace.rootPath, value.path);
            this.aquireLock(this.gerrit, this.gerrit.reset, [filePath, false]).then(value => {
            }, reason => {
            });
        }, (reason: common.RejectReason) => {
            // TODO: handle exception thrown here 
            if (reason.type === common.RejectType.NO_DIRTY && reason.showInformation) {
                window.showInformationMessage(reason.message);
            }
        });
    }

    // TODO: clean file from quick pick, requires getStagedFiles
    // TODO: clean untracked files with git clean -f <path>
    public cleanAll() {
        common.confirm("Clean all files? This cannot be undone").then(value => {
            if (value) {
                this.aquireLock(this.gerrit, this.gerrit.clean, ["."]);
            }
        });
    }

    public cleanCurrentFile() {
        let filePath: string = window.activeTextEditor.document.fileName;
        common.confirm(`Clean ${path.basename}? This cannot be undone`).then(value => {
            if (value) {
                this.aquireLock(this.gerrit, this.gerrit.clean, [filePath]);
            }
        });
    }

    public commit() {
        let options: InputBoxOptions = {
            placeHolder: "Commit Message",
            prompt: "The commit description"
        };

        window.showInputBox(options).then(message => {
            this.aquireLock(this.gerrit, this.gerrit.commit, [message, [""], false]);
        }, reason => {
        });
    }

    public commitAmend() {
        this.aquireLock(this.gerrit, this.gerrit.commit, ["", [""], true]);
    }

    public checkoutBranch() {
        let options: InputBoxOptions = {
            value: "master",
            prompt: "The branch to checkout"
        };

        window.showInputBox(options).then(branch => {
            this.aquireLock(this.gerrit, this.gerrit.checkoutBranch, [branch]);
        }, reason => {
        });
    }

    public checkoutRevision() {
        let revisionOptions: InputBoxOptions = {
            placeHolder: "Ref Number",
            validateInput: utils.isValidNumber,
            prompt: "The revision to checkout"
        };

        window.showInputBox(revisionOptions).then(refString => {
            if (utils.isValidNumber(refString) !== null) {
                window.showWarningMessage("Valid Ref number not entered");
                return;
            }
            let refId = parseInt(refString);
            let patchsetOptions: InputBoxOptions = revisionOptions;
            patchsetOptions.placeHolder = `Patchset for Ref: ${refString}`;
            patchsetOptions.prompt = "The patchset to checkout";

            window.showInputBox(patchsetOptions).then(patchString => {
                if (utils.isValidNumber(patchString) !== null) {
                    window.showWarningMessage("Valid PatchSetnumber not entered");
                    return;
                }
                let patchId = parseInt(patchString);
                let newRef: Ref = new Ref(refId, patchId);
                this.aquireLock(this.gerrit, this.gerrit.checkoutRef, [newRef]);
            }, reason => {
            });
        }, reason => {
        });
    }

    public cherrypickRevision() {
        let revisionOptions: InputBoxOptions = {
            placeHolder: "Ref Number",
            validateInput: utils.isValidNumber,
            prompt: "The revision to cherrypick"
        };

        window.showInputBox(revisionOptions).then(refString => {
            if (utils.isValidNumber(refString) !== null) {
                window.showWarningMessage("Valid Ref number not entered");
                return;
            }
            let refId = parseInt(refString);
            let patchsetOptions: InputBoxOptions = revisionOptions;
            patchsetOptions.placeHolder = `Patchset for Ref: ${refString}`;
            patchsetOptions.prompt = "The patchset to cherrypick";

            window.showInputBox(patchsetOptions).then(patchString => {
                if (utils.isValidNumber(patchString) !== null) {
                    window.showWarningMessage("Valid PatchSetnumber not entered");
                    return;
                }
                let patchId = parseInt(patchString);
                let newRef: Ref = new Ref(refId, patchId);
                this.aquireLock(this.gerrit, this.gerrit.cherrypickRef, [newRef]);
            }, reason => {
            });
        }, reason => {
        });
    }

    public cherrypickContinue() {
        this.aquireLock(this.gerrit, this.gerrit.cherrypickContinue, []);
    }

    public push() {
        let options: InputBoxOptions = {
            value: "master",
            prompt: "The branch to push"
        };

        window.showInputBox(options).then(branch => {
            this.aquireLock(this.gerrit, this.gerrit.push, [branch]);
        }, reason => {
        });
    }

    public rebase() {
        let rebaseOptions: InputBoxOptions = {
            placeHolder: "master",
            prompt: "The branch to rebase"
        };

        window.showInputBox(rebaseOptions).then(branch => {
            this.aquireLock(this.gerrit, this.gerrit.rebase, [branch]);
        }, reason => {
        });
    }

    public rebaseContinue() {
        this.gerrit.rebaseContinue();
        this.aquireLock(this.gerrit, this.gerrit.rebaseContinue, []);
    }

    private aquireLock<T, U, V>(thisArg: V, func: (...args: U[]) => Promise<T>, args?: U[]): Promise<T> {
        if (this.lock) {
            window.showInformationMessage("Gerrit command in progress...");
            return  new Promise<T>((resolve, reject) => reject("Locked"));
        } else {
            args = utils.setDefault(args, []);
            this.lock = true;
            return func.apply(thisArg, args).then(value => {
                this.lock = false;
                return value;
            }, reason => {
                this.lock = false;
                return reason;
            });
        }
    }
}
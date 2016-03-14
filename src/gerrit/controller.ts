import { window, workspace, InputBoxOptions,
    StatusBarItem, StatusBarAlignment,
    QuickPickOptions } from "vscode";
import { Gerrit } from "./gerrit";
import { Ref } from "./ref";
import { Logger } from "../view/logger";
import * as utils from "../common/utils";
import * as common from "../common/common";
import * as path from "path";
import * as fs from "fs";
import * as octicon from "../common/octicons";
import { StatusBar } from "../view/statusbar";

export class GerritController {
    private logger: Logger;
    private statusBar: StatusBar;
    private lock: boolean;

    constructor(private gerrit: Gerrit) {
        this.statusBar = new StatusBar();
        this.gerrit.setStatusBar(this.statusBar);
        this.logger = Logger.logger;
        this.lock = false;
    }

    public stageAll() {
        this.aquireLock(this.gerrit, this.gerrit.stage, ["."]);
    }

    public stageCurrentFile() {
        let filePath: string = window.activeTextEditor.document.fileName;
        fs.stat(filePath, (err, stats) => {
            if (!err) {
                this.aquireLock(this.gerrit, this.gerrit.stage, [filePath]);
            }
        });
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
                    return;
                }
                resolve(value.getDescriptors());
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
            if (reason.type === common.RejectType.NO_DIRTY && reason.showInformation) {
                window.showInformationMessage(reason.message);
            }
        });
    }

    public resetAll() {
        this.aquireLock(this.gerrit, this.gerrit.reset, [".", false]);
    }

    public resetCurrentFile() {
        let filePath: string = window.activeTextEditor.document.fileName;
        fs.stat(filePath, (err, stats) => {
            if (!err) {
                this.aquireLock(this.gerrit, this.gerrit.reset, [filePath, false]);
            }
        });
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
                    return;
                }
                resolve(value.getDescriptors());
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
        fs.stat(filePath, (err, stats) => {
            if (!err) {
                common.confirm(`Clean ${path.basename}? This cannot be undone`).then(value => {
                    if (value) {
                        this.aquireLock(this.gerrit, this.gerrit.clean, [filePath]);
                    }
                });
            }
        });
    }

    public commit() {
        let options: InputBoxOptions = {
            placeHolder: "Commit Message",
            prompt: "The commit description"
        };

        window.showInputBox(options).then(message => {
            this.aquireLock(this.gerrit, this.gerrit.commit, [message, false]);
        }, reason => {
        });
    }

    public commitAmend() {
        this.aquireLock(this.gerrit, this.gerrit.commit, ["", true]);
    }

    public checkoutBranch() {
        let options: QuickPickOptions = {
            placeHolder: "The branch to checkout"
        };

        window.showQuickPick(this.gerrit.getBranches(), options).then(branch => {
            if (utils.isNull(branch)) {
                return;
            }
            this.aquireLock(this.gerrit, this.gerrit.checkoutBranch, [branch]);
        }, reason => {
            console.log(reason);
        });
    }

    public checkoutRevision() {
        let revisionOptions: QuickPickOptions = {
            placeHolder: "The revision to checkout",
            matchOnDescription: true
        };

        window.showQuickPick(this.gerrit.getChanges(), revisionOptions).then(refValue => {
            if (utils.isNull(refValue)) {
                return;
            }
            let refId = refValue.change_number;
            if (utils.isNull(refId)) {
                window.showWarningMessage("Valid Ref number not entered");
                return;
            }
            let patchsetOptions: InputBoxOptions = revisionOptions;
            patchsetOptions.placeHolder = `Patchset for Ref: ${refValue.label}`;
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
                this.aquireLock(this.gerrit, this.gerrit.cherrypickRef, [newRef]).then(value => {
                }, reason => {
                    window.showWarningMessage("Resolve conflicts in cherry-pick");
                });
            }, reason => {
            });
        }, reason => {
        });
    }

    public cherrypickContinue() {
        this.aquireLock(this.gerrit, this.gerrit.cherrypickContinue, []);
    }

    public push() {
        let options: QuickPickOptions = {
            placeHolder: "The branch to push"
        };

        window.showQuickPick(this.gerrit.getBranches(), options).then(branch => {
            if (utils.isNull(branch)) {
                return;
            }
            this.aquireLock(this.gerrit, this.gerrit.push, [branch]);
        }, reason => {
        });
    }

    public rebase() {
        let rebaseOptions: QuickPickOptions = {
            placeHolder: "The branch to rebase"
        };

        window.showQuickPick(this.gerrit.getBranches(), rebaseOptions).then(branch => {
            if (utils.isNull(branch)) {
                return;
            }
            this.aquireLock(this.gerrit, this.gerrit.rebase, [branch]).then(value => {
            }, reason => {
                window.showWarningMessage("Resolve conflicts in rebase");
            });
        }, reason => {
        });
    }

    public rebaseContinue() {
        this.gerrit.rebaseContinue();
        this.aquireLock(this.gerrit, this.gerrit.rebaseContinue, []);
    }

    private aquireLock<T, U, V>(thisArg: T, func: (...args: U[]) => Promise<V>, args?: U[]): Promise<V> {
        if (this.lock) {
            window.showInformationMessage("Gerrit command in progress...");
            return new Promise<V>((resolve, reject) => reject("Locked"));
        } else {
            this.statusBar.updateStatusBarIcon(this.statusBar, octicon.OCTICONS.SYNC);
            args = utils.setDefault(args, []);
            this.lock = true;
            return func.apply(thisArg, args).then(value => {
                this.lock = false;
                this.statusBar.updateStatusBarIcon(this.statusBar, octicon.OCTICONS.CHECK);
                return value;
            }, reason => {
                this.lock = false;
                this.statusBar.updateStatusBarIcon(this.statusBar, octicon.OCTICONS.STOP);
                return reason;
            });
        }
    }
}
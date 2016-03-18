import { window, workspace, InputBoxOptions,
    StatusBarItem, StatusBarAlignment,
    QuickPickOptions } from "vscode";
import { Gerrit } from "./gerrit";
import { Git } from "./git";
import { Ref } from "./ref";
import { Logger } from "../view/logger";
import * as utils from "../common/utils";
import * as common from "../common/common";
import * as path from "path";
import * as fs from "fs";
import * as octicon from "../common/octicons";
import { StatusBar } from "../view/statusbar";
import { GitStatus } from "./files/fileContainer";

export class GerritController {
    private logger: Logger;
    private statusBar: StatusBar;
    private lock: boolean;
    private gerrit: Gerrit;
    private git: Git;

    constructor() {
        this.gerrit = Gerrit.getInstance();
        this.git = Git.getInstance();
        this.statusBar = new StatusBar();
        this.gerrit.setStatusBar(this.statusBar);
        this.logger = Logger.logger;
        this.lock = false;
    }

    public stageAll() {
        this.aquireLock(this.git, this.git.stage, ["."]);
    }

    public stageCurrentFile() {
        let filePath: string = window.activeTextEditor.document.fileName;
        fs.stat(filePath, (err, stats) => {
            if (!err) {
                this.aquireLock(this.git, this.git.stage, [filePath]);
            }
        });
    }

    public stageFile() {
        window.showQuickPick<common.FileStageQuickPick>(
            this.aquireLock(this.gerrit, this.gerrit.getDirtyFiles).then(value => {
                if (value.length === 0) {
                    let reason: common.RejectReason = {
                        showInformation: true,
                        message: "No files to stage",
                        type: common.RejectType.NO_DIRTY
                    };
                    Promise.reject(reason);
                }
                return value.getDescriptorsByType([
                    GitStatus.DELETED,
                    GitStatus.MODIFIED,
                    GitStatus.UNTRACKED
                ]);
            }),
            { placeHolder: "File to stage" }).then(value => {
                if (utils.isNull(value)) {
                    return;
                }
                let filePath = path.join(workspace.rootPath, value.path);
                this.aquireLock(this.git, this.git.stage, [filePath]).then(value => {
                }, reason => {
                });
            }, (reason: common.RejectReason) => {
                if (reason.type === common.RejectType.NO_DIRTY && reason.showInformation) {
                    window.showInformationMessage(reason.message);
                }
            });
    }

    public resetAll() {
        this.aquireLock(this.git, this.git.reset, [".", false]);
    }

    public resetCurrentFile() {
        let filePath: string = window.activeTextEditor.document.fileName;
        fs.stat(filePath, (err, stats) => {
            if (!err) {
                this.aquireLock(this.git, this.git.reset, [filePath, false]);
            }
        });
    }

    public resetFile() {
        window.showQuickPick<common.FileStageQuickPick>(
            this.aquireLock(this.gerrit, this.gerrit.getStagedFiles).then(value => {
                if (value.length === 0) {
                    let reason: common.RejectReason = {
                        showInformation: true,
                        message: "No staged files",
                        type: common.RejectType.NO_DIRTY
                    };
                    Promise.reject(reason);
                }
                return value.getDescriptorsByType([GitStatus.STAGED]);
            }),
            { placeHolder: "File to reset" }).then(value => {
                if (utils.isNull(value)) {
                    return;
                }
                let filePath: string = path.join(workspace.rootPath, value.path);
                this.aquireLock(this.git, this.git.reset, [filePath, false]).then(value => {
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
                this.aquireLock(this.git, this.git.clean, ["."]);
            }
        });
    }

    public cleanCurrentFile() {
        let filePath: string = window.activeTextEditor.document.fileName;
        fs.stat(filePath, (err, stats) => {
            if (!err) {
                common.confirm(`Clean ${path.basename}? This cannot be undone`).then(value => {
                    if (value) {
                        this.aquireLock(this.git, this.git.clean, [filePath]);
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
            if (utils.isNull(message)) {
                return;
            }
            this.aquireLock(this.git, this.git.commit, [message, false]);
        }, reason => {
        });
    }

    public commitAmend() {
        this.aquireLock(this.git, this.git.commit, ["", true]);
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

            let patchsetOptions: QuickPickOptions = revisionOptions;
            patchsetOptions.placeHolder = `Patchset for Ref: ${refValue.label}`;

            window.showQuickPick(this.gerrit.getPatchsets(refValue.change_number), patchsetOptions).then(patchValue => {
                if (utils.isNull(refValue)) {
                    return;
                }
                let patchId = patchValue.patchset;
                if (utils.isNull(patchId)) {
                    window.showWarningMessage("Valid PatchSet number not entered");
                    return;
                }
                let newRef: Ref = new Ref(refId, patchId);
                this.aquireLock(this.gerrit, this.gerrit.checkoutRef, [newRef]);
            }, reason => {
            });
        }, reason => {
        });
    }

    public cherrypickRevision() {
        let revisionOptions: QuickPickOptions = {
            placeHolder: "The revision to cherrypick",
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

            let patchsetOptions: QuickPickOptions = revisionOptions;
            patchsetOptions.placeHolder = `Patchset for Ref: ${refValue.label}`;

            window.showQuickPick(this.gerrit.getPatchsets(refValue.change_number), patchsetOptions).then(patchValue => {
                if (utils.isNull(refValue)) {
                    return;
                }
                let patchId = patchValue.patchset;
                if (utils.isNull(patchId)) {
                    window.showWarningMessage("Valid PatchSet number not entered");
                    return;
                }
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
        this.aquireLock(this.git, this.git.cherrypickContinue, []);
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
        this.aquireLock(this.git, this.git.rebaseContinue, []);
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

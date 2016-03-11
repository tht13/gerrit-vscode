import { window, StatusBarItem, StatusBarAlignment } from "vscode";
import * as octicon from "../common/octicons";
import * as utils from "../common/utils";
import Event from "../common/event";
import { Ref } from"../gerrit/ref";

export class StatusBar {
    private statusBarText: StatusBarFormat;
    private statusBarItem: StatusBarItem;
    private statusBarIcon: octicon.OCTICONS;

    constructor() {
        this.statusBarIcon = octicon.OCTICONS.CHECK;
        this.statusBarText = {
            icon: octicon.getOcticon(this.statusBarIcon),
            ref: "",
            branch: ""
        };
        this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 10);
        this.statusBarItem.command = "gerrit.checkoutRevision";
        this.updateStatusBar();
        Event.on("ref.change", this.updateStatusBarRef);
        Event.on("branch.change", this.updateStatusBarBranch);

    }

    private updateStatusBar() {
        this.setStatusBarText();
    }

    public updateStatusBarRef(_this: StatusBar, ref: Ref) {
        if (!utils.isNull(ref) && _this.statusBarText.ref !== ref.text) {
            _this.statusBarText.ref = ref.text;
            _this.updateStatusBar();
        }
    }

    public updateStatusBarBranch(_this: StatusBar, branch: string) {
        if (!utils.isNull(branch) && _this.statusBarText.branch !== branch) {
            _this.statusBarText.ref = branch;
            _this.updateStatusBar();
        }
    }
    public updateStatusBarIcon(_this: StatusBar, icon: octicon.OCTICONS) {
        if (!utils.isNull(icon) && octicon.getOcticon(_this.statusBarIcon) !== octicon.getOcticon(icon)) {
            _this.statusBarIcon = icon;
            _this.statusBarText.icon = octicon.getOcticon(_this.statusBarIcon);
            _this.updateStatusBar();
        }
    }

    private setStatusBarText() {
        let icon = (this.statusBarText.icon.length > 0) ? ` $(${this.statusBarText.icon})` : "";
        let branch = this.statusBarText.branch;
        let ref = this.statusBarText.ref;
        let text = `Gerrit:${branch}:${ref}${icon} `;
        this.statusBarItem.text = text;
        this.statusBarItem.show();
    }

}

interface StatusBarFormat {
    icon: string;
    ref: string;
    branch: string;
}

import * as vscode from 'vscode';

export class Inspector {

    static statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -100)

    static register = (context: vscode.ExtensionContext) => {
        Inspector.statusBarItem.text = "Open Developer Tools"
        context.subscriptions.push(Inspector.statusBarItem)
        vscode.debug.onDidReceiveDebugSessionCustomEvent(e => {
            if (e.event === "xt.activeDeveloperTools") {
                Inspector.shared.active()
            }
        })
        vscode.debug.onDidTerminateDebugSession(() => {
            Inspector.shared.deactive()
        })
    }

    static shared = new Inspector

    ask() {
        vscode.window.showQuickPick([
            "XT: Open Network Inspector",
            "XT: Open Network Inspector (Right-Side)",
            "XT: Open User Defaults Inspector",
            "XT: Open User Defaults (Right-Side)"
        ]).then((value) => {
            if (value === "XT: Open Network Inspector") {
                vscode.commands.executeCommand("xt.showNetworkInspector")
            }
            else if (value === "XT: Open Network Inspector (Right-Side)") {
                vscode.commands.executeCommand("xt.showNetworkInspector.onRightSide")
            }
            else if (value === "XT: Open User Defaults Inspector") {
                vscode.commands.executeCommand("xt.showUserDefaultsInspector")
            }
            else if (value === "XT: Open User Defaults (Right-Side)") {
                vscode.commands.executeCommand("xt.showUserDefaultsInspector.onRightSide")
            }
        })
    }

    active() {
        Inspector.statusBarItem.command = "xt.askDeveloperTools"
        Inspector.statusBarItem.show()
    }

    deactive() {
        Inspector.statusBarItem.hide()
    }

}
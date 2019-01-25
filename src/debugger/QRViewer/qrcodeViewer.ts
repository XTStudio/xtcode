import * as vscode from 'vscode';
import { DebugSession } from '../debugSession';

export class QRCodeViewer {

    static statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -100)

    static register = (context: vscode.ExtensionContext) => {
        QRCodeViewer.statusBarItem.text = "Show QR Code"
        context.subscriptions.push(QRCodeViewer.statusBarItem)
        vscode.debug.onDidReceiveDebugSessionCustomEvent(e => {
            if (e.event === "xt.activeQRCode") {
                QRCodeViewer.shared.active(e.body.url)
            }
        })
        vscode.debug.onDidTerminateDebugSession(() => {
            QRCodeViewer.shared.deactive()
        })
    }

    static shared = new QRCodeViewer

    private codeUrl: string = ""

    active(url: string) {
        QRCodeViewer.statusBarItem.command = "xt.showQRCode"
        QRCodeViewer.statusBarItem.show()
        this.codeUrl = url
        this.openTerminal()
    }

    openTerminal() {
        const terminal = vscode.window.createTerminal("QRCode Viewer")
        terminal.show()
        terminal.sendText(`echo 'QRCode Content >>> ${this.codeUrl}'`)
        terminal.sendText(`echo '${this.codeUrl}' | ./node_modules/.bin/qrcode-terminal -s`)
        vscode.commands.executeCommand("workbench.action.terminal.focus")
    }

    deactive() {
        QRCodeViewer.statusBarItem.hide()
    }

}
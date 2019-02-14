import * as vs from "vscode";
import * as path from "path";

export class UserDefaultsInspector {

    run(context: vs.ExtensionContext, onRight: boolean = false) {
        const panel = vs.window.createWebviewPanel("userDefaults", "User Defaults", onRight === true ? vs.ViewColumn.Two : vs.ViewColumn.One, {
            localResourceRoots: [vs.Uri.file(path.join(context.extensionPath, 'media'))],
            enableScripts: true
        })
        panel.webview.html = this.getWebviewContents(context)
        panel.onDidChangeViewState(() => {
            panel.webview.html = this.getWebviewContents(context)
        })
    }

    getWebviewContents(context: vs.ExtensionContext): string {
        const nonce = getNonce();
        const onDiskPath = vs.Uri.file(
            path.join(context.extensionPath, 'media', 'redirect.html')
        );
        const redirectSrc = onDiskPath.with({ scheme: 'vscode-resource' });
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';">
        </head>
        <body style="margin: 0;">
            <script nonce="${nonce}">
                setTimeout(function(){
                    document.body.innerHTML = '<div id="fullArea" style="position: absolute; left: 0px; right: 0px; height: 100%; opacity: 1;"><iframe src="${redirectSrc.toString()}#http://127.0.0.1:8090/inspector/userDefaults.html" style="position: absolute; width: 100%; height: 100%; border: 0px" /></div>'
                }, 100)
            </script>
        </body>
        </html>`
    }

}

function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
import * as vs from 'vscode';

export class InstallProject {

    run() {
        const terminal = vs.window.createTerminal({ cwd: vs.workspace.rootPath, name: "npm install" })
        terminal.sendText("npm i && ./node_modules/.bin/xt init");
        terminal.show()
    }

}
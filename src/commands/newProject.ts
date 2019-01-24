import * as vs from 'vscode';
import { Uri } from 'vscode';
import * as path from "path";
import * as fs from "fs";

const projectNameRegex = new RegExp("^[a-z][a-z0-9_]*$");

export class NewProject {

    async run(fromSource: boolean = false) {
        const name = await vs.window.showInputBox({ prompt: "Enter a name for your new project", placeHolder: "hello_world", validateInput: this.validateProjectName });
        if (!name)
            return;

        const folders = await vs.window.showOpenDialog({ canSelectFolders: true, openLabel: "Save" });
        if (!folders || folders.length !== 1)
            return;
        const folderUri = folders[0];
        const projectFolderUri = Uri.file(path.join(folderUri.fsPath, name));

        if (fs.existsSync(projectFolderUri.fsPath)) {
            vs.window.showErrorMessage(`A folder named ${name} already exists in ${folderUri.fsPath}`);
            return;
        }
        fs.mkdirSync(projectFolderUri.fsPath);
        fs.writeFileSync(`${projectFolderUri.fsPath}/package.json`, `
        {
            "name": "${name}",
            "version": "1.0.0",
            "dependencies": {
                "xt-studio": "${fromSource ? "git+https://github.com/XTStudio/xt.git" : "*"}"
            }
        }
        `)
        fs.writeFileSync(path.join(projectFolderUri.fsPath, "install.sh"), `#!/bin/bash\ncd ${projectFolderUri.fsPath} && npm i && ./node_modules/.bin/xt init && rm ./install.sh`)
        require("child_process").execSync(`chmod +x ${path.join(projectFolderUri.fsPath, "install.sh")} && open -a Terminal ${path.join(projectFolderUri.fsPath, "install.sh")}`)
        const hasFoldersOpen = !!(vs.workspace.workspaceFolders && vs.workspace.workspaceFolders.length);
        const openInNewWindow = hasFoldersOpen;
        vs.commands.executeCommand("vscode.openFolder", projectFolderUri, openInNewWindow);
    }

    private validateProjectName(input: string) {
        if (!projectNameRegex.test(input))
            return "XT project names should be all lowercase, with underscores to separate words";
    }

}
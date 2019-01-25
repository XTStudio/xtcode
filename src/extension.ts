import * as vscode from 'vscode';
import { DebugConfigurationProvider } from "./debugger/debugConfigurationProvider";
import { NewProject } from './commands/newProject';
import { InstallProject } from './commands/installProject';
import { QRCodeViewer } from './debugger/QRViewer/qrcodeViewer';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('xt.newProject', () => {
		new NewProject().run()
	}))
	context.subscriptions.push(vscode.commands.registerCommand('xt.newProject.fromSource', () => {
		new NewProject().run(true)
	}))
	context.subscriptions.push(vscode.commands.registerCommand('xt.installProject', () => {
		new InstallProject().run()
	}))
	QRCodeViewer.register(context)
	context.subscriptions.push(vscode.commands.registerCommand('xt.showQRCode', () => {
		QRCodeViewer.shared.openTerminal()
	}))
	const provider = new DebugConfigurationProvider()
	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('xt', provider))
}

// this method is called when your extension is deactivated
export function deactivate() { }

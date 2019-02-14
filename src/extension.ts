import * as vscode from 'vscode';
import { DebugConfigurationProvider } from "./debugger/debugConfigurationProvider";
import { NewProject } from './commands/newProject';
import { InstallProject } from './commands/installProject';
import { QRCodeViewer } from './debugger/QRViewer/qrcodeViewer';
import { NetworkInspector } from './inspector/networkInspector';
import { Inspector } from './inspector/inspector';
import { UserDefaultsInspector } from './inspector/userDefaultsInspector';

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
	Inspector.register(context)
	context.subscriptions.push(vscode.commands.registerCommand("xt.askDeveloperTools", () => {
		Inspector.shared.ask()
	}))
	context.subscriptions.push(vscode.commands.registerCommand('xt.showNetworkInspector', () => {
		new NetworkInspector().run(context)
	}))
	context.subscriptions.push(vscode.commands.registerCommand('xt.showNetworkInspector.onRightSide', () => {
		new NetworkInspector().run(context, true)
	}))
	context.subscriptions.push(vscode.commands.registerCommand('xt.showUserDefaultsInspector', () => {
		new UserDefaultsInspector().run(context)
	}))
	context.subscriptions.push(vscode.commands.registerCommand('xt.showUserDefaultsInspector.onRightSide', () => {
		new UserDefaultsInspector().run(context, true)
	}))
	const provider = new DebugConfigurationProvider()
	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('xt', provider))
}

// this method is called when your extension is deactivated
export function deactivate() { }

import * as vscode from 'vscode';
import { WorkspaceFolder, DebugConfiguration, ProviderResult, CancellationToken } from 'vscode';

export class DebugConfigurationProvider implements vscode.DebugConfigurationProvider {

	resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {
		if (!config.type && !config.request && !config.name) {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				config.type = 'xt';
				config.name = 'Debug XT on Chrome';
				config.request = 'launch';
                config.workspace = '${workspaceFolder}';
                config.platform = "chrome";
			}
		}
		if (!config.workspace) {
			return vscode.window.showInformationMessage("Cannot find a workspace to debug").then(_ => {
				return undefined;	// abort launch
			});
		}
		return config;
    }
    
}
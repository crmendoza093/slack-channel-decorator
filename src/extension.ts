import * as vscode from 'vscode';
import { CacheManager } from './cache';
import { SlackClient } from './slackClient';
import { SlackHoverProvider } from './hoverProvider';
import { SlackDecorator } from './decorator';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Slack Channel Decorator is now active');

    // Initialize Cache and Client
    const cacheManager = new CacheManager(context.globalStorageUri.fsPath);
    const slackClient = new SlackClient(cacheManager);

    // Load token from secret storage
    const token = await context.secrets.get('slack-bot-token');
    if (token) {
        slackClient.setToken(token);
    }

    // Initialize Providers
    const hoverProvider = new SlackHoverProvider(slackClient);
    const decorator = new SlackDecorator(slackClient);

    // Register Hover Provider for all document types
    context.subscriptions.push(
        vscode.languages.registerHoverProvider('*', hoverProvider)
    );

    // Command to clear cache
    let clearCacheCmd = vscode.commands.registerCommand('slack-channel-decorator.clearCache', () => {
        cacheManager.clear();
        decorator.triggerUpdateDecorations();
        vscode.window.showInformationMessage('Slack Channel Cache cleared!');
    });

    // Command to set token
    let setTokenCmd = vscode.commands.registerCommand('slack-channel-decorator.setToken', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'Enter your Slack Bot Token (xoxb-...)',
            password: true,
            ignoreFocusOut: true
        });

        if (input) {
            await context.secrets.store('slack-bot-token', input);
            slackClient.setToken(input);
            decorator.triggerUpdateDecorations();
            vscode.window.showInformationMessage('Slack Bot Token saved securely.');
        }
    });

    context.subscriptions.push(clearCacheCmd, setTokenCmd);

    // Decorator Event Listeners
    if (vscode.window.activeTextEditor) {
        decorator.updateActiveEditor(vscode.window.activeTextEditor);
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        decorator.updateActiveEditor(editor);
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            decorator.triggerUpdateDecorations(true);
        }
    }, null, context.subscriptions);

    // Listen for secret changes (in case token is updated on another window)
    context.secrets.onDidChange(async (e) => {
        if (e.key === 'slack-bot-token') {
            const newToken = await context.secrets.get('slack-bot-token');
            if (newToken) {
                slackClient.setToken(newToken);
                decorator.triggerUpdateDecorations();
            }
        }
    });
}

export function deactivate() { }

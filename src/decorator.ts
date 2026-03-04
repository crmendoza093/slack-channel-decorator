import * as vscode from 'vscode';
import { SlackClient } from './slackClient';

export class SlackDecorator {
    private slackClient: SlackClient;
    private decoratorType: vscode.TextEditorDecorationType;
    private activeEditor: vscode.TextEditor | undefined;
    private timeout: NodeJS.Timeout | undefined;
    private validExtensions: string[] = ['yml', 'yaml', 'rb', 'env', 'json', 'js', 'ts'];

    constructor(slackClient: SlackClient) {
        this.slackClient = slackClient;

        // Register the visual style for the inline decorator
        this.decoratorType = vscode.window.createTextEditorDecorationType({
            after: {
                margin: '0 0 0 12px',
            }
        });

        // Load config
        const config = vscode.workspace.getConfiguration('slackChannelDecorator');
        const configuredExts = config.get<string[]>('extensionsToScan');
        if (configuredExts) {
            this.validExtensions = configuredExts;
        }
    }

    public updateActiveEditor(editor: vscode.TextEditor | undefined) {
        this.activeEditor = editor;
        if (editor) {
            this.triggerUpdateDecorations();
        }
    }

    public triggerUpdateDecorations(throttle = false) {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        if (throttle) {
            this.timeout = setTimeout(() => this.updateDecorations(), 500);
        } else {
            this.updateDecorations();
        }
    }

    private async updateDecorations() {
        if (!this.activeEditor) {
            return;
        }

        const document = this.activeEditor.document;

        // Check if file extension is supported
        const uriPath = document.uri.path;
        const extMatch = uriPath.match(/\.([^.]+)$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : '';
        if (ext && !this.validExtensions.includes(ext)) {
            return;
        }

        const text = document.getText();
        const regex = /C[A-Z0-9]{8,14}/g;
        let match;

        const decorations: vscode.DecorationOptions[] = [];
        const missingIds: string[] = [];

        // Find all matches
        const matches: vscode.Range[] = [];
        const channelIds: string[] = [];

        while ((match = regex.exec(text))) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            matches.push(new vscode.Range(startPos, endPos));
            channelIds.push(match[0]);
        }

        for (let i = 0; i < matches.length; i++) {
            const range = matches[i];
            const channelId = channelIds[i];

            const info = this.slackClient.hasToken() ? await this.slackClient.resolveChannel(channelId) : null;

            if (info) {
                decorations.push({
                    range,
                    renderOptions: {
                        after: {
                            contentText: ` 💬 ${info.name} `,
                            color: '#4ec9b0',
                            backgroundColor: 'rgba(78, 201, 176, 0.12)',
                            border: '1px solid rgba(78, 201, 176, 0.25)'
                        }
                    }
                });
            } else if (!this.slackClient.hasToken()) {
                decorations.push({
                    range,
                    renderOptions: {
                        after: {
                            contentText: ` 💬 [Setup token to view] `,
                            color: '#858585',
                            backgroundColor: 'rgba(133,133,133,0.1)',
                            border: '1px solid rgba(133,133,133,0.25)'
                        }
                    }
                });
            } else {
                decorations.push({
                    range,
                    renderOptions: {
                        after: {
                            contentText: ` 💬 Unknown Channel `,
                            color: '#e8a63a',
                            backgroundColor: 'rgba(232, 166, 58, 0.1)',
                            border: '1px solid rgba(232,166,58,0.25)'
                        }
                    }
                });
            }
        }

        this.activeEditor.setDecorations(this.decoratorType, decorations);
    }
}

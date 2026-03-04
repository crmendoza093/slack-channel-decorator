import * as vscode from 'vscode';
import { SlackClient } from './slackClient';

export class SlackHoverProvider implements vscode.HoverProvider {
    private slackClient: SlackClient;

    constructor(slackClient: SlackClient) {
        this.slackClient = slackClient;
    }

    async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | null> {
        if (!this.slackClient.hasToken()) {
            return null;
        }

        const range = document.getWordRangeAtPosition(position, /C[A-Z0-9]{8,14}/);
        if (!range) {
            return null;
        }

        const channelId = document.getText(range);

        // Fetch or get from cache
        const info = await this.slackClient.resolveChannel(channelId);

        if (!info) {
            return new vscode.Hover(`**Slack Channel Decorator**\n\nCould not resolve channel ID \`${channelId}\` (Token missing, invalid, or no access).`, range);
        }

        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;

        const typeIcon = info.isPrivate ? '🔒' : '📢';
        const typeText = info.isPrivate ? 'Private Channel' : 'Public Channel';

        markdown.appendMarkdown(`### 💬 ${info.name}\n`);
        markdown.appendMarkdown(`--- \n`);
        markdown.appendMarkdown(`**ID:** \`${info.id}\` | **Type:** ${typeIcon} ${typeText}\n`);

        return new vscode.Hover(markdown, range);
    }
}

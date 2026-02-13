import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography';
import { SettingsGroupContent, SettingsGroupTitle, SettingsGroupWrapper } from '../../components/SettingsGroup.styles';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

const AGENTS = ['claude-code', 'cursor', 'windsurf', 'custom'] as const;
type AgentId = (typeof AGENTS)[number];

const agentLabels: Record<AgentId, string> = {
    'claude-code': 'Claude Code',
    cursor: 'Cursor',
    windsurf: 'Windsurf',
    custom: 'Custom',
};

interface AgentSnippet {
    description: string;
    config: string;
    instructions: string;
    jsonConfig?: string;
}

function buildSnippets(port: number, token: string): Record<AgentId, AgentSnippet> {
    const serverUrl = `http://127.0.0.1:${port}/mcp`;

    return {
        'claude-code': {
            description: 'Add to your project or global Claude Code MCP config:',
            config: `claude mcp add tari-universe ${serverUrl} -t http -s user -H "Authorization: Bearer ${token}"`,
            instructions: 'Run this command in your terminal, or paste the JSON below into `.claude/settings.json`:',
            jsonConfig: JSON.stringify(
                {
                    mcpServers: {
                        'tari-universe': {
                            type: 'streamable-http',
                            url: serverUrl,
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    },
                },
                null,
                2
            ),
        },
        cursor: {
            description: 'Add to your Cursor MCP configuration:',
            config: JSON.stringify(
                {
                    mcpServers: {
                        'tari-universe': {
                            url: serverUrl,
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    },
                },
                null,
                2
            ),
            instructions: 'Open Cursor Settings → MCP → Add Server, or paste this into `.cursor/mcp.json`:',
        },
        windsurf: {
            description: 'Add to your Windsurf MCP configuration:',
            config: JSON.stringify(
                {
                    mcpServers: {
                        'tari-universe': {
                            serverUrl: serverUrl,
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    },
                },
                null,
                2
            ),
            instructions:
                'Open Windsurf Settings → MCP → Add Server, or paste this into `~/.codeium/windsurf/mcp_config.json`:',
        },
        custom: {
            description: 'Use these details to configure any MCP-compatible client:',
            config: JSON.stringify(
                {
                    transport: 'streamable-http',
                    url: serverUrl,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
                null,
                2
            ),
            instructions: 'Server URL and authentication details:',
        },
    };
}

export default function AgentConfig() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const redactedToken = useConfigMcpStore((s) => s.bearer_token_redacted);
    const serverRunning = useMcpStore((s) => s.serverRunning);
    const serverPort = useMcpStore((s) => s.serverPort);

    const [activeAgent, setActiveAgent] = useState<AgentId>('claude-code');
    const [fullToken, setFullToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!enabled || !redactedToken) return;
        invoke<string | null>('get_mcp_token')
            .then(setFullToken)
            .catch((e) => console.error('Failed to get MCP token:', e));
    }, [enabled, redactedToken]);

    const snippets = useMemo(() => {
        if (!serverPort || !fullToken) return null;
        return buildSnippets(serverPort, fullToken);
    }, [serverPort, fullToken]);

    const handleCopy = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy config:', e);
        }
    }, []);

    if (!enabled || !redactedToken || !serverRunning || !snippets) return null;

    const activeSnippet = snippets[activeAgent];

    return (
        <SettingsGroupWrapper>
            <SettingsGroupContent>
                <SettingsGroupTitle>
                    <Typography variant="h6">{t('mcp.agent-config.title')}</Typography>
                </SettingsGroupTitle>
                <Typography variant="p">{t('mcp.agent-config.description')}</Typography>

                <TabBar>
                    {AGENTS.map((id) => (
                        <Tab key={id} $active={activeAgent === id} onClick={() => setActiveAgent(id)}>
                            {agentLabels[id]}
                        </Tab>
                    ))}
                </TabBar>

                <ConfigPanel>
                    <InstructionText>{activeSnippet.instructions}</InstructionText>
                    <CodeBlock>
                        <code>{activeSnippet.config}</code>
                    </CodeBlock>
                    <CopyButton onClick={() => handleCopy(activeSnippet.config)}>
                        {copied ? t('mcp.agent-config.copied') : t('mcp.agent-config.copy')}
                    </CopyButton>
                    {activeSnippet.jsonConfig && (
                        <>
                            <InstructionText style={{ marginTop: 8 }}>
                                {t('mcp.agent-config.or-add-to-settings-json')}
                            </InstructionText>
                            <CodeBlock>
                                <code>{activeSnippet.jsonConfig}</code>
                            </CodeBlock>
                            <CopyButton onClick={() => handleCopy(activeSnippet.jsonConfig!)}>
                                {t('mcp.agent-config.copy')} JSON
                            </CopyButton>
                        </>
                    )}
                </ConfigPanel>
            </SettingsGroupContent>
        </SettingsGroupWrapper>
    );
}

const TabBar = styled.div`
    display: flex;
    gap: 0;
    margin-top: 8px;
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

const Tab = styled.button<{ $active: boolean }>`
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: ${({ theme }) => theme.palette.text.secondary};
    transition: all 0.15s ease;

    &:hover {
        color: ${({ theme }) => theme.palette.text.primary};
    }

    ${({ $active }) =>
        $active &&
        css`
            color: ${({ theme }) => theme.palette.text.primary};
            border-bottom-color: ${({ theme }) => theme.palette.primary.main};
        `}
`;

const ConfigPanel = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
`;

const InstructionText = styled.p`
    font-size: 11px;
    line-height: 1.4;
    opacity: 0.7;
    margin: 0;
`;

const CodeBlock = styled.pre`
    font-size: 11px;
    line-height: 1.5;
    padding: 10px 12px;
    border-radius: 6px;
    background: ${({ theme }) => theme.palette.background.default};
    border: 1px solid ${({ theme }) => theme.palette.divider};
    overflow-x: auto;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;

    code {
        font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    }
`;

const CopyButton = styled.button`
    align-self: flex-start;
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    background: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.text.primary};
    transition: all 0.15s ease;

    &:hover {
        background: ${({ theme }) => theme.palette.action?.hover || theme.palette.divider};
    }
`;

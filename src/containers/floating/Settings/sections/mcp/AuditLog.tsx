import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { McpAuditEntry, useMcpStore } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect } from 'react';

const tierColors: Record<string, string> = {
    read: '#4a9eff',
    control: '#f0a030',
    transaction: '#e05050',
};

const statusIcons: Record<string, string> = {
    Started: '⏳',
    Success: '✅',
    Error: '❌',
    Denied: '🚫',
    RateLimited: '⏱️',
};

export default function AuditLog() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const entries = useMcpStore((s) => s.auditEntries);

    useEffect(() => {
        if (!enabled) return;
        invoke<McpAuditEntry[]>('get_mcp_audit_log', { count: 50 })
            .then((data) => {
                useMcpStore.setState({ auditEntries: data });
            })
            .catch((e) => console.error('Failed to load audit log:', e));
    }, [enabled]);

    const handleExport = useCallback(async () => {
        try {
            const data = await invoke<string>('export_mcp_audit_log');
            const blob = new Blob([data], { type: 'application/x-ndjson' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mcp_audit_log.jsonl';
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Failed to export audit log:', e);
        }
    }, []);

    if (!enabled) return null;

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('mcp.audit-log.title')}</Typography>
                    </SettingsGroupTitle>
                    <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 11, marginTop: 4 }}>
                        {entries.length === 0 ? (
                            <Typography variant="p" style={{ opacity: 0.5 }}>
                                {t('mcp.audit-log.empty')}
                            </Typography>
                        ) : (
                            entries.map((entry, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        gap: 8,
                                        padding: '2px 0',
                                        borderBottom: '1px solid rgba(128,128,128,0.1)',
                                    }}
                                >
                                    <span>{statusIcons[entry.status] || '•'}</span>
                                    <span style={{ color: tierColors[entry.tier] || '#888', minWidth: 70 }}>
                                        [{entry.tier}]
                                    </span>
                                    <span style={{ flex: 1 }}>{entry.tool_name}</span>
                                    {entry.duration_ms != null && (
                                        <span style={{ opacity: 0.5 }}>
                                            {t('mcp.audit-log.duration-ms', { ms: entry.duration_ms })}
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    {entries.length > 0 && (
                        <button onClick={handleExport} style={{ fontSize: 11, marginTop: 4, cursor: 'pointer' }}>
                            {t('mcp.audit-log.export')}
                        </button>
                    )}
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}

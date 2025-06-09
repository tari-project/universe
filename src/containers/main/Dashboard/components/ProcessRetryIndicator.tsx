import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BinaryRetryEvent, BinaryCorruptionEvent, AlertSeverity } from '../../../../types/retry-config';
import { LinearProgress } from '../../../../components/elements/LinearProgress';
import { Typography } from '../../../../components/elements/Typography';
import { Button } from '../../../../components/elements/buttons/Button';
import { TECHNICAL_MESSAGES, STATUS_ICONS } from './ProcessRetryIndicator.constants';

const Container = styled.div`
    position: fixed;
    top: 80px;
    right: 20px;
    width: 350px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    background: ${({ theme }) => theme.palette.background.accent};
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.palette.primary.main};
`;

const RetryItem = styled.div<{ $severity: AlertSeverity }>`
    margin-bottom: 12px;
    padding: 8px;
    border-radius: 4px;
    border-left: 4px solid
        ${({ theme, $severity }) => {
            switch ($severity) {
                case AlertSeverity.Critical:
                    return theme.palette.error?.main || '#ff4444';
                case AlertSeverity.Error:
                    return theme.palette.error?.main || '#ff4444';
                case AlertSeverity.Warning:
                    return theme.palette.warning?.main || '#ffaa00';
                case AlertSeverity.Info:
                default:
                    return theme.palette.primary.main;
            }
        }};
    background: ${({ theme }) => theme.palette.background.default};
`;

const FlexRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const FlexBetween = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

const ProgressContainer = styled.div`
    margin-top: 8px;
`;

const TimeRemaining = styled.div`
    font-size: 0.75rem;
    color: ${({ theme }) => theme.palette.text.secondary};
    margin-top: 4px;
`;

const StatusIcon = styled.div<{ $severity: AlertSeverity }>`
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ theme, $severity }) => {
        switch ($severity) {
            case AlertSeverity.Critical:
                return theme.palette.error?.main || '#ff4444';
            case AlertSeverity.Error:
                return theme.palette.error?.main || '#ff4444';
            case AlertSeverity.Warning:
                return theme.palette.warning?.main || '#ffaa00';
            case AlertSeverity.Info:
            default:
                return theme.palette.primary.main;
        }
    }};
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
    font-weight: bold;
`;

const CollapsibleContent = styled.div<{ $isCollapsed: boolean }>`
    max-height: ${({ $isCollapsed }) => ($isCollapsed ? '0' : '300px')};
    overflow: hidden;
    transition: max-height 0.3s ease;
`;

interface ProcessRetryState extends BinaryRetryEvent {
    id: string;
    startTime: number;
    isExpanded?: boolean;
}

interface CorruptionState extends BinaryCorruptionEvent {
    id: string;
    timestamp: number;
}

export function ProcessRetryIndicator() {
    const [activeRetries, setActiveRetries] = useState<Map<string, ProcessRetryState>>(new Map());
    const [corruptionEvents, setCorruptionEvents] = useState<CorruptionState[]>([]);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        const handleBackendStateUpdate = (event: CustomEvent) => {
            const backendEvent = event.detail;
            switch (backendEvent.event_type) {
                case 'BinaryStartupAttempt':
                case 'BinaryRuntimeRestart':
                    handleRetryEvent(backendEvent.payload as BinaryRetryEvent);
                    break;
                case 'BinaryPermanentFailure':
                    handlePermanentFailure(backendEvent.payload.process_name);
                    break;
                case 'BinaryCorruptionDetected':
                    handleCorruptionEvent(backendEvent.payload as BinaryCorruptionEvent);
                    break;
                case 'BinaryIntegrityRestored':
                    handleIntegrityRestored(backendEvent.payload);
                    break;
            }
        };

        window.addEventListener('backend_state_update', handleBackendStateUpdate as EventListener);

        return () => {
            window.removeEventListener('backend_state_update', handleBackendStateUpdate as EventListener);
        };
    }, []);

    const handleRetryEvent = (event: BinaryRetryEvent) => {
        const id = `${event.process_name}-${event.retry_reason}`;
        setActiveRetries((prev) => {
            const newMap = new Map(prev);
            newMap.set(id, {
                ...event,
                id,
                startTime: Date.now(),
            });
            return newMap;
        });

        // Auto-remove after completion or timeout
        setTimeout(
            () => {
                setActiveRetries((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(id);
                    return newMap;
                });
            },
            (event.next_retry_in_seconds || 30) * 1000
        );
    };

    const handlePermanentFailure = (processName: string) => {
        setActiveRetries((prev) => {
            const newMap = new Map(prev);
            // Remove all retries for this process
            for (const [key, value] of newMap.entries()) {
                if (value.process_name === processName) {
                    newMap.delete(key);
                }
            }
            return newMap;
        });
    };

    const handleCorruptionEvent = (event: BinaryCorruptionEvent) => {
        const corruptionState: CorruptionState = {
            ...event,
            id: `corruption-${Date.now()}`,
            timestamp: Date.now(),
        };

        setCorruptionEvents((prev) => [corruptionState, ...prev.slice(0, 4)]); // Keep last 5

        // Auto-remove after 30 seconds
        setTimeout(() => {
            setCorruptionEvents((prev) => prev.filter((e) => e.id !== corruptionState.id));
        }, 30000);
    };

    const handleIntegrityRestored = (processName: string) => {
        // Remove corruption events for this process
        setCorruptionEvents((prev) => prev.filter((e) => e.process_name !== processName));
    };

    const getProgressValue = (retry: ProcessRetryState): number => {
        if (!retry.next_retry_in_seconds) return 100;

        const elapsed = (Date.now() - retry.startTime) / 1000;
        const progress = (elapsed / retry.next_retry_in_seconds) * 100;
        return Math.min(progress, 100);
    };

    const getTimeRemaining = (retry: ProcessRetryState): string => {
        if (!retry.next_retry_in_seconds) return '';

        const elapsed = (Date.now() - retry.startTime) / 1000;
        const remaining = Math.max(0, retry.next_retry_in_seconds - elapsed);
        return `${Math.ceil(remaining)}s remaining`;
    };

    const getSeverityIcon = (severity: AlertSeverity) => {
        switch (severity) {
            case AlertSeverity.Critical:
            case AlertSeverity.Error:
                return <StatusIcon $severity={severity}>{STATUS_ICONS.ERROR}</StatusIcon>;
            case AlertSeverity.Warning:
                return <StatusIcon $severity={severity}>{STATUS_ICONS.WARNING}</StatusIcon>;
            case AlertSeverity.Info:
            default:
                return <StatusIcon $severity={severity}>{STATUS_ICONS.INFO}</StatusIcon>;
        }
    };

    const getRetrySeverity = (retry: ProcessRetryState): AlertSeverity => {
        if (retry.attempt_number >= retry.max_attempts * 0.8) {
            return AlertSeverity.Critical;
        }
        if (retry.attempt_number >= retry.max_attempts * 0.5) {
            return AlertSeverity.Warning;
        }
        return AlertSeverity.Info;
    };

    const hasActiveEvents = activeRetries.size > 0 || corruptionEvents.length > 0;

    if (!hasActiveEvents) {
        return null;
    }

    return (
        <Container>
            <FlexBetween>
                <Typography variant="h6" style={{ fontWeight: 'bold' }}>
                    {TECHNICAL_MESSAGES.PROCESS_STATUS}
                </Typography>
                <Button onClick={() => setIsMinimized(!isMinimized)} variant="secondary" size="small">
                    {isMinimized ? STATUS_ICONS.EXPAND : STATUS_ICONS.COLLAPSE}
                </Button>
            </FlexBetween>

            <CollapsibleContent $isCollapsed={isMinimized}>
                {/* Active Retries */}
                {Array.from(activeRetries.values()).map((retry) => {
                    const severity = getRetrySeverity(retry);
                    const progress = getProgressValue(retry);
                    const timeRemaining = getTimeRemaining(retry);

                    return (
                        <RetryItem key={retry.id} $severity={severity}>
                            <FlexRow>
                                {getSeverityIcon(severity)}
                                <Typography variant="p" style={{ fontWeight: 'bold' }}>
                                    {retry.process_name}
                                </Typography>
                            </FlexRow>

                            <Typography variant="span" style={{ color: 'inherit', opacity: 0.7, fontSize: '0.8rem' }}>
                                {retry.retry_reason}
                                {TECHNICAL_MESSAGES.RETRY_REASON_SEPARATOR}
                                {TECHNICAL_MESSAGES.ATTEMPT_TEMPLATE(retry.attempt_number, retry.max_attempts)}
                            </Typography>

                            {retry.next_retry_in_seconds && (
                                <ProgressContainer>
                                    <LinearProgress value={progress} />
                                    <TimeRemaining>{timeRemaining}</TimeRemaining>
                                </ProgressContainer>
                            )}
                        </RetryItem>
                    );
                })}

                {/* Corruption Events */}
                {corruptionEvents.map((corruption) => (
                    <RetryItem key={corruption.id} $severity={AlertSeverity.Error}>
                        <FlexRow>
                            <StatusIcon $severity={AlertSeverity.Error}>{STATUS_ICONS.ERROR}</StatusIcon>
                            <Typography variant="p" style={{ fontWeight: 'bold' }}>
                                {corruption.process_name}
                            </Typography>
                        </FlexRow>

                        <Typography variant="span" style={{ color: 'inherit', opacity: 0.7, fontSize: '0.8rem' }}>
                            {TECHNICAL_MESSAGES.BINARY_CORRUPTION_DETECTED}
                        </Typography>

                        {corruption.redownload_initiated && (
                            <div style={{ marginTop: '8px' }}>
                                <Typography variant="span" style={{ color: '#4caf50', fontSize: '0.8rem' }}>
                                    <StatusIcon
                                        $severity={AlertSeverity.Info}
                                        style={{
                                            display: 'inline-block',
                                            marginRight: '4px',
                                            backgroundColor: '#4caf50',
                                        }}
                                    >
                                        {STATUS_ICONS.SUCCESS}
                                    </StatusIcon>
                                    {TECHNICAL_MESSAGES.REDOWNLOAD_INITIATED}
                                </Typography>
                            </div>
                        )}
                    </RetryItem>
                ))}
            </CollapsibleContent>
        </Container>
    );
}

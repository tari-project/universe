import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { LinearProgress, Typography, Box, Alert, AlertTitle, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess, Warning, Error, Info, CheckCircle } from '@mui/icons-material';
import { BinaryRetryEvent, BinaryCorruptionEvent, AlertSeverity } from '../../../../types/retry-config';

const Container = styled(Box)`
  position: fixed;
  top: 80px;
  right: 20px;
  width: 350px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  background: ${({ theme }) => theme.palette.background.paper};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows[4]};
  padding: 12px;
`;

const RetryItem = styled(Box)`
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 4px;
  border-left: 4px solid ${({ theme, $severity }: { theme: any; $severity: AlertSeverity }) => {
    switch ($severity) {
      case AlertSeverity.Critical:
        return theme.palette.error.main;
      case AlertSeverity.Error:
        return theme.palette.error.main;
      case AlertSeverity.Warning:
        return theme.palette.warning.main;
      case AlertSeverity.Info:
      default:
        return theme.palette.info.main;
    }
  }};
  background: ${({ theme }) => theme.palette.background.default};
`;

const ProgressContainer = styled(Box)`
  margin-top: 8px;
`;

const TimeRemaining = styled(Typography)`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.text.secondary};
  margin-top: 4px;
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
    // This would integrate with the actual event listener
    // For now, this is a placeholder for the implementation
    const handleBackendStateUpdate = (event: any) => {
      switch (event.event_type) {
        case 'BinaryStartupAttempt':
        case 'BinaryRuntimeRestart':
          handleRetryEvent(event.payload as BinaryRetryEvent);
          break;
        case 'BinaryPermanentFailure':
          handlePermanentFailure(event.payload.process_name);
          break;
        case 'BinaryCorruptionDetected':
          handleCorruptionEvent(event.payload as BinaryCorruptionEvent);
          break;
        case 'BinaryIntegrityRestored':
          handleIntegrityRestored(event.payload);
          break;
      }
    };

    // Mock event listener setup - replace with actual implementation
    // window.addEventListener('backend_state_update', handleBackendStateUpdate);
    
    return () => {
      // window.removeEventListener('backend_state_update', handleBackendStateUpdate);
    };
  }, []);

  const handleRetryEvent = (event: BinaryRetryEvent) => {
    const id = `${event.process_name}-${event.retry_reason}`;
    setActiveRetries(prev => {
      const newMap = new Map(prev);
      newMap.set(id, {
        ...event,
        id,
        startTime: Date.now(),
      });
      return newMap;
    });

    // Auto-remove after completion or timeout
    setTimeout(() => {
      setActiveRetries(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }, (event.next_retry_in_seconds || 30) * 1000);
  };

  const handlePermanentFailure = (processName: string) => {
    setActiveRetries(prev => {
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
    
    setCorruptionEvents(prev => [corruptionState, ...prev.slice(0, 4)]); // Keep last 5

    // Auto-remove after 30 seconds
    setTimeout(() => {
      setCorruptionEvents(prev => prev.filter(e => e.id !== corruptionState.id));
    }, 30000);
  };

  const handleIntegrityRestored = (processName: string) => {
    // Remove corruption events for this process
    setCorruptionEvents(prev => 
      prev.filter(e => e.process_name !== processName)
    );
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
        return <Error fontSize="small" />;
      case AlertSeverity.Warning:
        return <Warning fontSize="small" />;
      case AlertSeverity.Info:
      default:
        return <Info fontSize="small" />;
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" fontWeight="bold">
          Process Status
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? <ExpandMore /> : <ExpandLess />}
        </IconButton>
      </Box>

      <Collapse in={!isMinimized}>
        {/* Active Retries */}
        {Array.from(activeRetries.values()).map((retry) => {
          const severity = getRetrySeverity(retry);
          const progress = getProgressValue(retry);
          const timeRemaining = getTimeRemaining(retry);

          return (
            <RetryItem key={retry.id} $severity={severity}>
              <Box display="flex" alignItems="center" gap={1}>
                {getSeverityIcon(severity)}
                <Typography variant="body2" fontWeight="bold">
                  {retry.process_name}
                </Typography>
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                {retry.retry_reason} - Attempt {retry.attempt_number} of {retry.max_attempts}
              </Typography>

              {retry.next_retry_in_seconds && (
                <ProgressContainer>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress}
                    color={severity === AlertSeverity.Critical ? 'error' : 'primary'}
                  />
                  <TimeRemaining>{timeRemaining}</TimeRemaining>
                </ProgressContainer>
              )}
            </RetryItem>
          );
        })}

        {/* Corruption Events */}
        {corruptionEvents.map((corruption) => (
          <RetryItem key={corruption.id} $severity={AlertSeverity.Error}>
            <Box display="flex" alignItems="center" gap={1}>
              <Error fontSize="small" color="error" />
              <Typography variant="body2" fontWeight="bold">
                {corruption.process_name}
              </Typography>
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              Binary corruption detected
            </Typography>
            
            {corruption.redownload_initiated && (
              <Box mt={1}>
                <Typography variant="caption" color="success.main">
                  <CheckCircle fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                  Re-download initiated
                </Typography>
              </Box>
            )}
          </RetryItem>
        ))}
      </Collapse>
    </Container>
  );
}

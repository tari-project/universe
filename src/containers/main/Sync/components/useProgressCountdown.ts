import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNodeStore } from '@app/store/useNodeStore';
import { useTranslation } from 'react-i18next';
import { useSetupStore } from '@app/store/useSetupStore';
import { useExchangeStore } from '@app/store/useExchangeStore';

const MIN_PER_BLOCK_SYNC = 0.002866666667;
const REMOTE_DEFAULT_ESTIMATE = 120;

const getLocalNodeEstimate = (nodeSetupParams: Record<string, string> | undefined): number => {
    if (nodeSetupParams) {
        const { step, local_header_height, tip_header_height, local_block_height, tip_block_height } = nodeSetupParams;
        if (step === 'Header' && local_header_height != null && tip_header_height != null) {
            const remainingHeaders = Number(tip_header_height) - Number(local_header_height);
            const estimatedMinutes = (remainingHeaders + Number(tip_block_height)) * MIN_PER_BLOCK_SYNC + 1;
            return Math.ceil(estimatedMinutes * 60); // Convert to seconds
        }
        if (step === 'Block' && local_block_height != null && tip_block_height != null) {
            const remainingBlocks = Number(tip_block_height) - Number(local_block_height);
            const estimatedMinutes = remainingBlocks * MIN_PER_BLOCK_SYNC + 1;
            return Math.ceil(estimatedMinutes * 60); // Convert to seconds
        }
    }
    return 60;
};

function hasValidEstimate(nodeSetupParams: Record<string, string> | undefined) {
    if (!nodeSetupParams) return false;
    if (nodeSetupParams.step === 'Header') {
        return +nodeSetupParams.tip_header_height > 0;
    }
    if (nodeSetupParams.step === 'Block') {
        return +nodeSetupParams.tip_block_height > 0;
    }

    return false;
}

export const useProgressCountdown = (isCompact = false) => {
    const { t } = useTranslation('setup-progresses');
    const isNodePhaseCompleted = useSetupStore((state) => Boolean(state.node_phase_setup_payload?.is_completed));
    const nodeSetupParams = useSetupStore((state) => state.node_phase_setup_payload?.title_params);
    const nodeType = useNodeStore((s) => s.node_type);
    const [countdown, setCountdown] = useState(nodeType !== 'Local' ? REMOTE_DEFAULT_ESTIMATE : -1);
    const showUniversalModal = useExchangeStore((s) => s.showUniversalModal);

    useEffect(() => {
        if (showUniversalModal) {
            setCountdown(-1);
        } else {
            setCountdown(nodeType !== 'Local' ? REMOTE_DEFAULT_ESTIMATE : -1);
        }
    }, [showUniversalModal, nodeType]);

    useEffect(() => {
        if (countdown < 0 && hasValidEstimate(nodeSetupParams)) {
            // Update Local Node estimate when sync params retrieved
            const estimate = getLocalNodeEstimate(nodeSetupParams);
            setCountdown(estimate);
        }
    }, [countdown, nodeSetupParams]);

    useEffect(() => {
        // Handle node type changes during setup
        if (!nodeType) return;
        if (nodeType === 'Local') {
            if (!hasValidEstimate(nodeSetupParams)) {
                setCountdown(-1);
            }
        } else {
            setCountdown(REMOTE_DEFAULT_ESTIMATE);
        }
        // eslint-disable-next-line react-compiler/react-compiler
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodeType]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown((prevCountdown) => {
                if (prevCountdown > 0) {
                    return prevCountdown - 1;
                }
                if (prevCountdown === 0) {
                    clearInterval(interval);
                }
                return prevCountdown;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [nodeType, isNodePhaseCompleted]);

    const formatTime = useCallback(
        (seconds: number) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor(seconds / 60) % 60;
            const remainingSeconds = seconds % 60;

            if (isCompact) {
                if (hours > 0) {
                    return `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m ${remainingSeconds}s`;
                }
                return `${minutes}m ${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}s`;
            }

            if (hours > 0) {
                return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
            }
            return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        },
        [isCompact]
    );

    const countdownText = useMemo(() => {
        if (nodeType === 'Local' && !isNodePhaseCompleted) {
            const hasValidEstimate =
                (nodeSetupParams?.step === 'Header' &&
                    nodeSetupParams?.local_header_height != null &&
                    nodeSetupParams?.tip_header_height != null) ||
                (nodeSetupParams?.step === 'Block' &&
                    nodeSetupParams?.local_block_height != null &&
                    nodeSetupParams?.tip_block_height != null);

            if (!hasValidEstimate) {
                return t('calculating_time', { context: isCompact ? 'compact' : undefined });
            }
        }

        if (countdown > 60) {
            return `${formatTime(countdown)} ${t('remaining')}`;
        }
        if (countdown > 1) {
            return `${countdown} ${t('seconds_remaining')}`;
        }
        if (countdown === 1) {
            return `${countdown} ${t('second_remaining')}`;
        }
        if (showUniversalModal) {
            return t('awaiting-exchange-selection');
        }
        return t('any_moment_now');
    }, [nodeType, isNodePhaseCompleted, countdown, showUniversalModal, t, nodeSetupParams, isCompact, formatTime]);

    return {
        countdown,
        countdownText,
        formattedTime: formatTime(countdown),
    };
};

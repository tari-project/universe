import { useState, useEffect, useMemo } from 'react';
import { useNodeStore } from '@app/store/useNodeStore';
import { useTranslation } from 'react-i18next';
import { useSetupStore } from '@app/store/useSetupStore';
import { getNodeType } from './Progress';

export const useProgressCountdown = () => {
    const { t } = useTranslation('setup-progresses');
    const isNodePhaseCompleted = useSetupStore((state) => Boolean(state.node_phase_setup_payload?.is_complete));
    const nodeSetupParams = useSetupStore((state) => state.node_phase_setup_payload?.title_params);
    const nodeType = useNodeStore((s) => getNodeType(s.node_type));

    const [countdown, setCountdown] = useState(nodeType === 'Remote' ? 120 : 60);

    useEffect(() => {
        if (nodeType === 'Local') {
            if (nodeSetupParams) {
                const { step, local_header_height, tip_header_height, local_block_height, tip_block_height } =
                    nodeSetupParams;
                // Calculate for header sync
                if (step === 'Header' && local_header_height != null && tip_header_height != null) {
                    const remainingHeaders = Number(tip_header_height) - Number(local_header_height);
                    const estimatedMinutes = remainingHeaders * 0.002866666667;
                    setCountdown(Math.ceil(estimatedMinutes * 60 * 2 + 60)); // Convert to seconds(double for blocks sync after)
                    return;
                }
                // Calculate for block sync
                if (step === 'Block' && local_block_height != null && tip_block_height != null) {
                    const remainingBlocks = Number(tip_block_height) - Number(local_block_height);
                    const estimatedMinutes = remainingBlocks * 0.002866666667 + 1;
                    setCountdown(Math.ceil(estimatedMinutes * 60)); // Convert to seconds
                    return;
                }
            }
        }
    }, [nodeType, nodeSetupParams, isNodePhaseCompleted]);

    useEffect(() => {
        // Only count down for remote node or local node with completed phase
        if (nodeType === 'Remote' || isNodePhaseCompleted) {
            const interval = setInterval(() => {
                setCountdown((prevCountdown) => {
                    if (prevCountdown > 0) {
                        return prevCountdown - 1;
                    } else {
                        clearInterval(interval);
                        return 0;
                    }
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [nodeType, isNodePhaseCompleted]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor(seconds / 60) % 60;
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        }

        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const countdownText = useMemo(() => {
        if (nodeType !== 'Remote' && !isNodePhaseCompleted) {
            const hasValidEstimate =
                (nodeSetupParams?.step === 'Header' &&
                    nodeSetupParams?.local_header_height != null &&
                    Number(nodeSetupParams?.tip_header_height) > 0) ||
                (nodeSetupParams?.step === 'Block' &&
                    nodeSetupParams?.local_block_height != null &&
                    Number(nodeSetupParams?.tip_block_height) > 0);

            if (!hasValidEstimate) {
                return t('calculating_time');
            }
        }

        if (countdown === 1) {
            return `${countdown} ${t('second_remaining')}`;
        }
        if (countdown > 60) {
            return `${formatTime(countdown)} ${t('remaining')}`;
        }
        if (countdown > 1) {
            return `${countdown} ${t('seconds_remaining')}`;
        }
        return t('any_moment_now');
    }, [nodeType, countdown, isNodePhaseCompleted, nodeSetupParams, t]);

    return {
        countdown,
        countdownText,
        formattedTime: formatTime(countdown),
    };
};

import { useCallback } from 'react';
import { GiPauseButton } from 'react-icons/gi';

import { IconWrapper, StyledButton, StyledIcon } from './MiningButton.styles.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { IoChevronForwardOutline, IoWarningOutline } from 'react-icons/io5';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

function MiningButton() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));

    const {
        startMining,
        stopMining,
        getMiningButtonStateText,
        isLoading,
        shouldMiningControlsBeEnabled,
        isConnectionLostDuringMining,
        cancelMining,
    } = useMiningControls();
    const handleClick = useCallback(() => {
        if (isConnectionLostDuringMining) {
            return cancelMining();
        }

        if (isMining) {
            return stopMining();
        }
        if (!isMining) {
            return startMining();
        }
    }, [isMining, startMining, stopMining, cancelMining, isConnectionLostDuringMining]);

    const icon = isMining ? <GiPauseButton /> : <IoChevronForwardOutline />;
    return (
        <Stack>
            <StyledButton
                variant="rounded"
                $hasStarted={isMining || isConnectionLostDuringMining}
                onClick={handleClick}
                icon={<IconWrapper>{isLoading ? <StyledIcon /> : icon}</IconWrapper>}
                disabled={!shouldMiningControlsBeEnabled}
            >
                <span>{t(`mining-button-text.${getMiningButtonStateText()}`)}</span>
            </StyledButton>
            {isConnectionLostDuringMining && (
                <Stack direction="row">
                    <IoWarningOutline size={32} />
                    <Typography variant="p">{t('connection-to-node-lost')}</Typography>
                </Stack>
            )}
        </Stack>
    );
}

export default MiningButton;

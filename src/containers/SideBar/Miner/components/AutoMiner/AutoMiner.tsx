import React, { useMemo } from 'react';
import { AutoMinerContainer, AutoMinerProgressBar } from './AutoMiner.styles';
import { invoke } from '@tauri-apps/api/tauri';
import { useAppStatusStore } from '@app/store/useAppStatusStore';
import { useMiningControls } from '@app/hooks/mining/useMiningControls';
import { Typography } from '@app/components/elements/Typography';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';

const calculatePercentageLeftToMine = (userInactivityTimeout: number, currentUserInactivityDuration: number) => {
    return (currentUserInactivityDuration / userInactivityTimeout) * 100;
};

function AutoMiner() {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const isAutoMining = useAppStatusStore((state) => state.auto_mining);
    const userInactivityTimeout = useAppStatusStore((state) => state.user_inactivity_timeout);
    const currentUserInactivityDuration = useAppStatusStore((state) => state.current_user_inactivity_duration);
    const { shouldAutoMiningControlsBeEnabled } = useMiningControls();

    const handleAutoMining = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        invoke('set_auto_mining', { autoMining: isChecked }).then(() => {
            console.info('Auto mining checked', isChecked);
        });
    };

    const percentage = useMemo(() => {
        if (!isAutoMining) return 0;
        if (!userInactivityTimeout || !currentUserInactivityDuration) return 0;
        return calculatePercentageLeftToMine(userInactivityTimeout, currentUserInactivityDuration);
    }, [userInactivityTimeout, currentUserInactivityDuration, isAutoMining]);

    return (
        <Stack>
            <AutoMinerContainer $percentage={percentage}>
                <Stack>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="h6">{t('auto-miner')}</Typography>
                        <ToggleSwitch
                            disabled={!shouldAutoMiningControlsBeEnabled}
                            checked={isAutoMining}
                            onChange={handleAutoMining}
                        />
                    </Stack>
                    <Typography variant="p">{t('auto-miner-description')}</Typography>
                </Stack>
                {isAutoMining && shouldAutoMiningControlsBeEnabled && (
                    <Stack>
                        <Typography variant="p">{currentUserInactivityDuration?.toFixed(2)}s</Typography>
                        <AutoMinerProgressBar value={percentage} />
                    </Stack>
                )}
            </AutoMinerContainer>
        </Stack>
    );
}

export default AutoMiner;

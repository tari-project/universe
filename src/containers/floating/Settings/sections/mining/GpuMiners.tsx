import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as m from 'motion/react-m';
import styled from 'styled-components';

import { Typography } from '@app/components/elements/Typography.tsx';
import { useMiningStore } from '@app/store/useMiningStore';
import { switchSelectedMiner } from '@app/store/actions/miningStoreActions.ts';
import { getSelectedMiner } from '@app/store/selectors/minningStoreSelectors';
import { GpuMinerType } from '@app/types/events-payloads.ts';
import { SettingsGroupContent, SettingsGroupTitle, SettingsGroupWrapper } from '../../components/SettingsGroup.styles';
import { GpuMinerSelect } from './components/GpuMinerSelect.tsx';

const Wrapper = styled(m.div)`
    width: 100%;
    display: flex;
    position: relative;
`;

export default function GpuMiners() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const availableMiners = useMiningStore((state) => state.availableMiners);
    const availableMinersValues = availableMiners ? Object.values(availableMiners).filter(Boolean) : undefined;
    const selectedMiner = useMiningStore(getSelectedMiner);
    const isSwitchingMiner = useMiningStore((state) => state.isSwitchingMiner);

    const handleMinerChange = useCallback(async (value: GpuMinerType) => {
        await switchSelectedMiner(value);
    }, []);

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('gpu-miners')}</Typography>
            </SettingsGroupTitle>
            {availableMinersValues && availableMinersValues.length > 0 ? (
                <SettingsGroupContent>
                    <Wrapper>
                        <GpuMinerSelect
                            miners={availableMinersValues}
                            selectedMiner={selectedMiner}
                            onChange={handleMinerChange}
                            disabled={isSwitchingMiner}
                        />
                    </Wrapper>
                </SettingsGroupContent>
            ) : (
                <Typography variant="p">{t('gpu-miners-not-found')}</Typography>
            )}
        </SettingsGroupWrapper>
    );
}

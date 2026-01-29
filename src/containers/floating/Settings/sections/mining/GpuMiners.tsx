import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useMiningStore } from '@app/store/useMiningStore';
import { useCallback } from 'react';
import { SettingsGroupContent, SettingsGroupTitle, SettingsGroupWrapper } from '../../components/SettingsGroup.styles';
import * as m from 'motion/react-m';
import { switchSelectedMiner } from '@app/store/actions/miningStoreActions.ts';
import { GpuMinerType } from '@app/types/events-payloads.ts';
import { getSelectedMiner } from '@app/store/selectors/miningStoreSelectors';
import { GpuMinerSelect } from './components/GpuMinerSelect.tsx';

const Wrapper = styled(m.div)`
    width: 100%;
    display: flex;
    position: relative;
`;

export default function GpuMiners() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const availableMiners = useMiningStore((state) => state.availableMiners);
    const availableMinersValues = availableMiners ? Object.values(availableMiners) : undefined;
    const selectedMiner = useMiningStore(getSelectedMiner);

    const handleMinerChange = useCallback(async (value: GpuMinerType) => {
        await switchSelectedMiner(value);
    }, []);

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('gpu-miners', { ns: 'settings' })}</Typography>
            </SettingsGroupTitle>
            {availableMinersValues && availableMinersValues?.length > 0 ? (
                <SettingsGroupContent>
                    <Wrapper>
                        <GpuMinerSelect
                            miners={availableMinersValues}
                            selectedMiner={selectedMiner}
                            onChange={handleMinerChange}
                            hideChips={true}
                        />
                    </Wrapper>
                </SettingsGroupContent>
            ) : (
                <Typography variant="p">{t('gpu-miners-not-found', { ns: 'settings' })}</Typography>
            )}
        </SettingsGroupWrapper>
    );
}

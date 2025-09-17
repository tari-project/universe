import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useMiningStore } from '@app/store/useMiningStore';
import { Select } from '@app/components/elements/inputs/Select';
import { useCallback, useMemo } from 'react';
import { SettingsGroupContent, SettingsGroupTitle, SettingsGroupWrapper } from '../../components/SettingsGroup.styles';
import * as m from 'motion/react-m';
import { switchSelectedMiner } from '@app/store/actions/miningStoreActions.ts';
import { GpuMinerType } from '@app/types/events-payloads.ts';
import light from '@app/theme/palettes/light';

const Wrapper = styled(m.div)`
    width: 100%;
    display: flex;
    position: relative;
`;

const minerLabel = {
    [GpuMinerType.LolMiner]: 'LolMiner(C29)',
    [GpuMinerType.Glytex]: 'Glytex(SHA3x)',
    [GpuMinerType.Graxil]: 'Graxil(SHA3x)',
};

export default function GpuMiners() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const availableMiners = useMiningStore((state) => state.availableMiners);
    const selectedMiner = useMiningStore((state) => state.selectedMiner);

    const minerOptions = useMemo(() => {
        return (
            availableMiners?.map((minerType) => ({
                label: minerLabel[minerType],
                value: minerType,
            })) || []
        );
    }, [availableMiners]);

    const handleMinerChange = useCallback(async (value: string) => {
        await switchSelectedMiner(value as GpuMinerType);
    }, []);

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('gpu-miners', { ns: 'settings' })}</Typography>
            </SettingsGroupTitle>
            {availableMiners && availableMiners.length > 0 ? (
                <SettingsGroupContent>
                    <Wrapper>
                        <Select
                            options={minerOptions}
                            onChange={handleMinerChange}
                            selectedValue={selectedMiner?.miner_type}
                            variant="bordered"
                            forceHeight={36}
                        />
                    </Wrapper>
                </SettingsGroupContent>
            ) : (
                <Typography variant="p">{t('gpu-miners-not-found', { ns: 'settings' })}</Typography>
            )}
        </SettingsGroupWrapper>
    );
}

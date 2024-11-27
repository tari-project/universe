import { useCallback } from 'react';
import gemImage from './images/gem.png';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { BoxWrapper, Gem1, Gem2, Gem3, Gem4, Position, Text, TextWrapper, Title } from './styles';

export default function AirdropPermission() {
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const setAllowTelemetry = useAppConfigStore((s) => s.setAllowTelemetry);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleChange = useCallback(async () => {
        await setAllowTelemetry(!allowTelemetry);
    }, [allowTelemetry, setAllowTelemetry]);

    return (
        <Position initial={{ x: -200, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <BoxWrapper>
                <Gem1 src={gemImage} alt="" />
                <Gem2 src={gemImage} alt="" />
                <Gem3 src={gemImage} alt="" />
                <Gem4 src={gemImage} alt="" />

                <TextWrapper>
                    <Title>{t('permission.title')}</Title>
                    <Text>{t('permission.text')}</Text>
                </TextWrapper>
                <ToggleSwitch checked={allowTelemetry} onChange={handleChange} />
            </BoxWrapper>
        </Position>
    );
}

import { useCallback } from 'react';
import gemImage from './images/gem.png';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { BoxWrapper, Gem1, Gem2, Gem3, Gem4, Position, Text, TextWrapper, Title } from './styles';

export default function AirdropPermission() {
    const wipUI = useAirdropStore((state) => state.wipUI);
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const setAllowTelemetry = useAppConfigStore((s) => s.setAllowTelemetry);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleChange = useCallback(async () => {
        await setAllowTelemetry(!allowTelemetry);
    }, [allowTelemetry, setAllowTelemetry]);

    return (
        <Position>
            <BoxWrapper>
                {wipUI && (
                    <>
                        <Gem1 src={gemImage} alt="" />
                        <Gem2 src={gemImage} alt="" />
                        <Gem3 src={gemImage} alt="" />
                        <Gem4 src={gemImage} alt="" />
                    </>
                )}

                <TextWrapper>
                    <Title>{t(wipUI ? 'permission.title' : 'permissionNoGems.title')}</Title>
                    <Text>{t(wipUI ? 'permission.text' : 'permissionNoGems.text')}</Text>
                </TextWrapper>
                <ToggleSwitch checked={allowTelemetry} onChange={handleChange} />
            </BoxWrapper>
        </Position>
    );
}

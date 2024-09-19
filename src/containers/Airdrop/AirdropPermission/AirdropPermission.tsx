import { BoxWrapper, Gem1, Gem2, Gem3, Gem4, Position, Text, TextWrapper, Title } from './styles';
import gemImage from './images/gem.png';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useAppStatusStore } from '@app/store/useAppStatusStore';
import { useAirdropStore } from '@app/store/useAirdropStore';

export default function AirdropPermission() {
    const telemetryMode = useAppStatusStore((s) => s.telemetry_mode);
    const setTelemetryMode = useAppStatusStore((s) => s.setTelemetryMode);
    const wipUI = useAirdropStore((state) => state.wipUI);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleChange = () => {
        setTelemetryMode(!telemetryMode);
        invoke('set_telemetry_mode', { telemetryMode: !telemetryMode });
    };

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
                <ToggleSwitch checked={telemetryMode} onChange={handleChange} />
            </BoxWrapper>
        </Position>
    );
}

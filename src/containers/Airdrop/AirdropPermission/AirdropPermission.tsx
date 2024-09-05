import { BoxWrapper, Gem1, Gem2, Gem3, Gem4, Position, Text, TextWrapper, Title } from './styles';
import gemImage from './images/gem.png';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { appConfig } from '@app/config';
import { useAppStatusStore } from '@app/store/useAppStatusStore';

export default function AirdropPermission() {
    const telemetryMode = useAppStatusStore((s) => s.telemetry_mode);
    const setTelemetryMode = useAppStatusStore((s) => s.setTelemetryMode);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleChange = () => {
        setTelemetryMode(!telemetryMode);
        invoke('set_telemetry_mode', { telemetryMode: !telemetryMode });
    };

    return (
        <Position>
            <BoxWrapper>
                {appConfig.displayAirdropWipUI && (
                    <>
                        <Gem1 src={gemImage} alt="" />
                        <Gem2 src={gemImage} alt="" />
                        <Gem3 src={gemImage} alt="" />
                        <Gem4 src={gemImage} alt="" />
                    </>
                )}

                <TextWrapper>
                    <Title>{t(appConfig.displayAirdropWipUI ? 'permission.title' : 'permissionNoGems.title')}</Title>
                    <Text>{t(appConfig.displayAirdropWipUI ? 'permission.text' : 'permissionNoGems.text')}</Text>
                </TextWrapper>
                <ToggleSwitch checked={telemetryMode} onChange={handleChange} />
            </BoxWrapper>
        </Position>
    );
}

import { BoxWrapper, Text, TextWrapper, Title, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { appConfig } from '@app/config';
import { useAppStatusStore } from '@app/store/useAppStatusStore';

export default function AirdropPermissionSettings() {
    const telemetryMode = useAppStatusStore((s) => s.telemetry_mode);
    const setTelemetryMode = useAppStatusStore((s) => s.setTelemetryMode);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleChange = () => {
        setTelemetryMode(!telemetryMode);
        invoke('set_telemetry_mode', { telemetryMode: !telemetryMode });
    };

    return (
        <Wrapper>
            <BoxWrapper>
                <TextWrapper>
                    <Title>{t(appConfig.displayAirdropWipUI ? 'permission.title' : 'permissionNoGems.title')}</Title>
                    <Text>{t(appConfig.displayAirdropWipUI ? 'permission.text' : 'permissionNoGems.text')}</Text>
                </TextWrapper>
                <ToggleSwitch checked={telemetryMode} onChange={handleChange} />
            </BoxWrapper>
        </Wrapper>
    );
}

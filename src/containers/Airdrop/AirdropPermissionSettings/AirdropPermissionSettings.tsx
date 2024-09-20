import { BoxWrapper, Text, TextWrapper, Title, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useAppStatusStore } from '@app/store/useAppStatusStore';
import { useAirdropStore } from '@app/store/useAirdropStore';

export default function AirdropPermissionSettings() {
    const telemetryMode = useAppStatusStore((s) => s.telemetry_mode);
    const setTelemetryMode = useAppStatusStore((s) => s.setTelemetryMode);
    const wipUI = useAirdropStore((state) => state.wipUI);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleChange = () => {
        setTelemetryMode(!telemetryMode);
        invoke('set_telemetry_mode', { telemetryMode: !telemetryMode });
    };

    return (
        <Wrapper>
            <BoxWrapper>
                <TextWrapper>
                    <Title>{t(wipUI ? 'permission.title' : 'permissionNoGems.title')}</Title>
                    <Text>{t(wipUI ? 'permission.text' : 'permissionNoGems.text')}</Text>
                </TextWrapper>
                <ToggleSwitch checked={telemetryMode} onChange={handleChange} />
            </BoxWrapper>
        </Wrapper>
    );
}

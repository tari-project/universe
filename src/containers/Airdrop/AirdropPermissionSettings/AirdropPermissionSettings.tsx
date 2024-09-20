import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useCallback } from 'react';
import { BoxWrapper, Text, TextWrapper, Title, Wrapper } from './styles';

export default function AirdropPermissionSettings() {
    const wipUI = useAirdropStore((state) => state.wipUI);
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const setAllowTelemetry = useAppConfigStore((s) => s.setAllowTelemetry);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleChange = useCallback(async () => {
        await setAllowTelemetry(!allowTelemetry);
    }, [allowTelemetry, setAllowTelemetry]);

    return (
        <Wrapper>
            <BoxWrapper>
                <TextWrapper>
                    <Title>{t(wipUI ? 'permission.title' : 'permissionNoGems.title')}</Title>
                    <Text>{t(wipUI ? 'permission.text' : 'permissionNoGems.text')}</Text>
                </TextWrapper>
                <ToggleSwitch checked={allowTelemetry} onChange={handleChange} />
            </BoxWrapper>
        </Wrapper>
    );
}

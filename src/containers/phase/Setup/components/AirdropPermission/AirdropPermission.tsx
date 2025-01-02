import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { BoxWrapper, Position, Text, TextWrapper, Title } from './styles';

export default function AirdropPermission() {
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const setAllowTelemetry = useAppConfigStore((s) => s.setAllowTelemetry);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleChange = useCallback(async () => {
        await setAllowTelemetry(!allowTelemetry);
    }, [allowTelemetry, setAllowTelemetry]);

    return (
        <Position initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <BoxWrapper>
                <TextWrapper>
                    <Title>{t('permission.title')}</Title>
                    <Text>{t('permission.text')}</Text>
                </TextWrapper>
                <ToggleSwitch checked={allowTelemetry} onChange={handleChange} />
            </BoxWrapper>
        </Position>
    );
}

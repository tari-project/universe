import { Switch } from '@mui/material';
import { BoxWrapper, Gem1, Gem2, Gem3, Gem4, Position, Text, TextWrapper, Title } from './styles';
import gemImage from './images/gem.png';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '@app/store/useUIStore';

export default function AirdropPermission() {
    const telemetryMode = useUIStore((s) => s.telemetryMode);
    const toggleTelemetryMode = useUIStore((s) => s.toggleTelemetryMode);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleChange = () => {
        toggleTelemetryMode();
        invoke('set_telemetry_mode', { telemetryMode: !telemetryMode });
    };

    return (
        <Position>
            <BoxWrapper>
                <Gem1 src={gemImage} alt="" />
                <Gem2 src={gemImage} alt="" />
                <Gem3 src={gemImage} alt="" />
                <Gem4 src={gemImage} alt="" />

                <TextWrapper>
                    <Title>{t('permission.title')}</Title>
                    <Text>{t('permission.text')}</Text>
                </TextWrapper>
                <Switch checked={telemetryMode} onChange={handleChange} color="primary" size="medium" />
            </BoxWrapper>
        </Position>
    );
}

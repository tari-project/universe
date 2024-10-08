import { useTranslation } from 'react-i18next';
import ConnectedPulse from './ConnectedPulse/ConnectedPulse';
import { Divider, Wrapper } from './styles';
import { useAppStateStore } from '@app/store/appStateStore';

interface Props {
    version: string;
}

export default function VersionChip({ version }: Props) {
    const { t } = useTranslation('common', { useSuspense: false });

    const isAppSettingUp = useAppStateStore((s) => s.isSettingUp);

    const isConnected = !isAppSettingUp;

    return (
        <Wrapper>
            <ConnectedPulse isConnected={isConnected} />
            <Divider />
            {t('testnet')} <span>{version}</span>
        </Wrapper>
    );
}

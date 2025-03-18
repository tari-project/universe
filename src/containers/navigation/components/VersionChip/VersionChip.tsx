import { useTranslation } from 'react-i18next';
import ConnectedPulse from './ConnectedPulse/ConnectedPulse';
import { Divider, Wrapper } from './styles';

import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

export default function VersionChip() {
    const { t } = useTranslation('common', { useSuspense: false });
    const currentVersion = import.meta.env.VITE_TARI_UNIVERSE_VERSION;
    const tariVersion = currentVersion ? `v${currentVersion}` : null;
    const isConnectedToTariNetwork = useMiningMetricsStore((s) => s.isNodeConnected);

    return (
        <Wrapper>
            <ConnectedPulse isConnected={isConnectedToTariNetwork} />
            <Divider />
            {t('testnet')} <span>{tariVersion}</span>
        </Wrapper>
    );
}

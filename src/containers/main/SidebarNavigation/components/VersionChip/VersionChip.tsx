import { useTranslation } from 'react-i18next';
import ConnectedPulse from './ConnectedPulse/ConnectedPulse';
import { Divider, Wrapper } from './styles';

import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

interface Props {
    version: string;
}

export default function VersionChip({ version }: Props) {
    const { t } = useTranslation('common', { useSuspense: false });

    const isConnectedToTariNetwork = useMiningMetricsStore((s) => s.isNodeConnected);

    return (
        <Wrapper>
            <ConnectedPulse isConnected={isConnectedToTariNetwork} />
            <Divider />
            {t('testnet')} <span>{version}</span>
        </Wrapper>
    );
}

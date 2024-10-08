import { useTranslation } from 'react-i18next';
import ConnectedPulse from './ConnectedPulse/ConnectedPulse';
import { Divider, Wrapper } from './styles';
import { useMiningStore } from '@app/store/useMiningStore';

interface Props {
    version: string;
}

export default function VersionChip({ version }: Props) {
    const { t } = useTranslation('common', { useSuspense: false });

    const isConnectedToTariNetwork = useMiningStore((s) => s.base_node?.is_connected);

    return (
        <Wrapper>
            <ConnectedPulse isConnected={isConnectedToTariNetwork} />
            <Divider />
            {t('testnet')} <span>{version}</span>
        </Wrapper>
    );
}

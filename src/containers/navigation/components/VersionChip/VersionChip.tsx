import { useTranslation } from 'react-i18next';
import ConnectedPulse from './ConnectedPulse/ConnectedPulse';
import { Divider, Wrapper } from './styles';
import { isMainNet } from '@app/utils/network';

export default function VersionChip() {
    const { t } = useTranslation('common', { useSuspense: false });
    const currentVersion = import.meta.env.VITE_TARI_UNIVERSE_VERSION;
    const tariVersion = currentVersion ? `v${currentVersion}` : null;

    return (
        <Wrapper>
            <ConnectedPulse />
            <Divider />
            {!isMainNet() && t('testnet')} <span>{tariVersion}</span>
        </Wrapper>
    );
}

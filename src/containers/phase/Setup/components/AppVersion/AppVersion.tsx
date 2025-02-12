import { useTranslation } from 'react-i18next';
import { Wrapper } from './styles';

export default function AppVersion() {
    const { t } = useTranslation('common', { useSuspense: false });

    const currentVersion = import.meta.env.VITE_TARI_UNIVERSE_VERSION;
    const tariVersion = currentVersion ? `v${currentVersion}` : null;

    if (!tariVersion) return null;

    return (
        <Wrapper>
            {t('testnet')} <span>{tariVersion}</span>
        </Wrapper>
    );
}

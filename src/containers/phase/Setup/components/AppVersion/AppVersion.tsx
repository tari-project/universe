import { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { useTranslation } from 'react-i18next';
import { Wrapper } from './styles';

export default function AppVersion() {
    const { t } = useTranslation('common', { useSuspense: false });
    const [tariVersion, setTariVersion] = useState<string | null>(null);

    useEffect(() => {
        getVersion().then((version) => {
            setTariVersion('v' + version);
        });
    }, []);

    if (!tariVersion) return null;

    return (
        <Wrapper>
            {t('testnet')} <span>{tariVersion}</span>
        </Wrapper>
    );
}

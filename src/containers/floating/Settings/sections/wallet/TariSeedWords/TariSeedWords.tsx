import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';
import SeedWords from '@app/components/wallet/seedwords/SeedWords.tsx';
import { useUIStore, useWalletStore } from '@app/store';
import { useExchangeStore } from '@app/store/useExchangeStore.ts';

export default function TariSeedWords() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const isSeedlessUI = useUIStore((s) => s.seedlessUI);

    return (
        <SettingsGroupWrapper $subGroup>
            <Typography variant="h6">{t('seed-words')}</Typography>
            <SeedWords isGenerated={isSeedlessUI} />
        </SettingsGroupWrapper>
    );
}

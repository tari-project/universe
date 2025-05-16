import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';
import SeedWords from '@app/components/wallet/seedwords/SeedWords.tsx';
import { useWalletStore } from '@app/store';

export default function TariSeedWords() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const is_tari_address_generated = useWalletStore((s) => s.is_tari_address_generated);

    return (
        <SettingsGroupWrapper $subGroup>
            <Typography variant="h6">{t('seed-words')}</Typography>
            <SeedWords isGenerated={!!is_tari_address_generated} />
        </SettingsGroupWrapper>
    );
}

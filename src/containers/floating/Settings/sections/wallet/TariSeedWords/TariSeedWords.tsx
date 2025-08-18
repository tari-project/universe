import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';
import SeedWords from '@app/components/wallet/seedwords/SeedWords.tsx';
import { useConfigUIStore } from '@app/store';
import EmptySeedWords from '@app/components/wallet/seedwords/EmptySeedWords';
import { WalletUIMode } from '@app/types/events-payloads';

export default function TariSeedWords() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const isStandardWalletUI = useConfigUIStore((s) => s.wallet_ui_mode === WalletUIMode.Standard);

    return (
        <SettingsGroupWrapper $subGroup>
            <Typography variant="h6">{t('seed-words')}</Typography>
            {isStandardWalletUI ? <SeedWords /> : <EmptySeedWords />}
        </SettingsGroupWrapper>
    );
}

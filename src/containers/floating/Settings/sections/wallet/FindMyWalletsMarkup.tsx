import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import FindMyWalletsDialog from '@app/containers/floating/WalletRecovery/FindMyWalletsDialog.tsx';

import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';

/**
 * Settings entry point for "find my wallets".
 *
 * The same action the wallet recovery screen offers, reachable when nothing is obviously wrong:
 * a user who imported a seed "just to test", or whose settings were recreated, sees their old
 * wallet listed here rather than having to describe it to support.
 */
export const FindMyWalletsMarkup = () => {
    const { t } = useTranslation('common', { useSuspense: false });
    const [open, setOpen] = useState(false);

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6" style={{ textTransform: 'uppercase' }}>
                    {t('find-my-wallets')}
                </Typography>
            </SettingsGroupTitle>
            <SettingsGroup>
                <SettingsGroupContent>
                    <Typography variant="p">{t('find-my-wallets-description')}</Typography>
                    <SettingsGroupTitle>
                        <Button variant="black" onClick={() => setOpen(true)} data-testid="wallet-find-my-wallets">
                            {t('find-my-wallets-search')}
                        </Button>
                    </SettingsGroupTitle>
                </SettingsGroupContent>
            </SettingsGroup>
            <FindMyWalletsDialog open={open} onOpenChange={setOpen} />
        </SettingsGroupWrapper>
    );
};

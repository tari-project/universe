import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

import { Typography } from '@app/components/elements/Typography';

import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import { useTappletProviderStore } from '@app/store/useTappletProviderStore';
import { Account } from '@tari-project/tarijs';

const OotleWalletBalance = () => {
    const { t } = useTranslation(['settings', 'ootle'], { useSuspense: false });
    const [account, setAccount] = useState<Account>();

    const tappProvider = useTappletProviderStore((s) => s.tappletProvider);
    const isTappInitialized = useTappletProviderStore((s) => s.isInitialized);
    const initTappletProvider = useTappletProviderStore((s) => s.initTappletProvider);

    const refreshAccount = useCallback(async () => {
        //TODO this is tmp to check if account is found and set; can be removed later
        console.info('TAPP PROVIDER', tappProvider);
        try {
            if (!tappProvider) {
                console.info('TAPP PROVIDER INIT');
                await initTappletProvider();
                return;
            }
            if (!account) {
                const acc = await tappProvider.getAccount();
                setAccount(acc);
            }
        } catch (error) {
            console.error(error);
        }
        console.info('TAPP ACCOUNT', account);
    }, [account, initTappletProvider, tappProvider]);

    useEffect(() => {
        refreshAccount();
    }, [refreshAccount]);

    return (
        <>
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <Typography>{t('Tari Ootle Wallet Balance')}</Typography>
                        <Typography>{t('Test')}</Typography>
                    </SettingsGroupContent>
                </SettingsGroup>
            </SettingsGroupWrapper>
        </>
    );
};

export default OotleWalletBalance;

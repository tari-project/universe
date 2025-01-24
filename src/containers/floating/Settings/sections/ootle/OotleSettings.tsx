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
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useCallback, useEffect, useState } from 'react';
import { TappletsOverview } from './TappletsOverview';
import { useTappletProviderStore } from '@app/store/useTappletProviderStore';
import { Account } from '@tari-project/tarijs';

export const OotleSettings = () => {
    const { t } = useTranslation(['settings', 'ootle'], { useSuspense: false });
    const ootleMode = useAppConfigStore((s) => s.ootle_enabled);
    const localIndexer = useAppConfigStore((s) => s.local_tari_indexer);
    const [account, setAccount] = useState<Account>();

    const setOotleMode = useAppConfigStore((s) => s.setOotleMode);
    const setLocalTariIndexer = useAppConfigStore((s) => s.setLocalTariIndexer);

    const tappProvider = useTappletProviderStore((s) => s.tappletProvider);
    const isTappInitialized = useTappletProviderStore((s) => s.isInitialized);
    const initTappletProvider = useTappletProviderStore((s) => s.initTappletProvider);

    const handleOotleSwitch = useCallback(() => {
        setOotleMode(!ootleMode);
    }, [ootleMode, setOotleMode]);

    const handleIndexerSwitch = useCallback(() => {
        setLocalTariIndexer(!localIndexer);
    }, [localIndexer, setLocalTariIndexer]);

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
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('tabs.ootle', { ns: 'settings' })}</Typography>
                        </SettingsGroupTitle>
                        <Typography>{t('Enable or disable the Tari Ootle')}</Typography>
                    </SettingsGroupContent>
                    <SettingsGroupAction style={{ alignItems: 'center' }}>
                        <ToggleSwitch checked={ootleMode} onChange={handleOotleSwitch} />
                    </SettingsGroupAction>
                </SettingsGroup>
            </SettingsGroupWrapper>
            {ootleMode && (
                <>
                    <SettingsGroupWrapper>
                        <SettingsGroup>
                            <SettingsGroupContent>
                                <SettingsGroupTitle>
                                    <Typography variant="h6">{t('local-tari-indexer', { ns: 'ootle' })}</Typography>
                                </SettingsGroupTitle>
                                <Typography>{t('Run Tari Indexer locally')}</Typography>
                            </SettingsGroupContent>
                            <SettingsGroupAction style={{ alignItems: 'center' }}>
                                <ToggleSwitch checked={localIndexer} onChange={handleIndexerSwitch} />
                            </SettingsGroupAction>
                        </SettingsGroup>
                        <TappletsOverview />
                    </SettingsGroupWrapper>
                </>
            )}
        </>
    );
};

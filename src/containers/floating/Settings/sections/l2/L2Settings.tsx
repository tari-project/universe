import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { selectL2Account, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { handleL2WalletStateUpdate } from '@app/store/actions/l2WalletStoreActions.ts';
import type { L2WalletState } from '@app/types/events-payloads.ts';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { CopyToClipboard } from '../wallet/WalletAddressMarkup/WalletAddressMarkup.tsx';
import { CTASArea, InputArea, WalletSettingsGrid } from '../wallet/styles.ts';
import {
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';

const fetchL2State = () => invoke<L2WalletState>('l2_get_state').then(handleL2WalletStateUpdate);

function Field({ label, value, testId }: { label: string; value: string; testId: string }) {
    return (
        <SettingsGroupContent>
            <Typography variant="p">{label}</Typography>
            <WalletSettingsGrid>
                <InputArea>
                    <Typography style={{ wordBreak: 'break-all' }} data-testid={testId}>
                        {value}
                    </Typography>
                </InputArea>
                <CTASArea>
                    <CopyToClipboard text={value} />
                </CTASArea>
            </WalletSettingsGrid>
        </SettingsGroupContent>
    );
}

export const L2Settings = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const hasPin = useWalletStore((s) => s.is_pin_locked);
    const enabled = useL2WalletStore((s) => s.enabled);
    const account = useL2WalletStore(selectL2Account);
    const indexerUrl = useConfigCoreStore((s) => s.ootle_indexer_url);
    const [enabling, setEnabling] = useState(false);
    const [error, setError] = useState('');

    // The panel may never have been opened, so catch up with the backend here too.
    useEffect(() => {
        if (!hasPin) return;
        fetchL2State().catch((e) => console.warn('Could not load L2 wallet state:', e));
    }, [hasPin]);

    async function enable() {
        setEnabling(true);
        setError('');
        try {
            await invoke('enable_l2_wallet');
            await fetchL2State();
        } catch (e) {
            setError(`${t('l2.enable-error')}${e}`);
        } finally {
            setEnabling(false);
        }
    }

    let status;
    if (!hasPin) {
        status = (
            <SettingsGroupContent data-testid="l2-settings-pin-required">
                <Typography>{t('l2.pin-required')}</Typography>
                <Button
                    size="small"
                    variant="black"
                    onClick={() => invoke('create_pin').catch((e) => console.error('Failed to create PIN:', e))}
                >
                    {t('l2.set-pin')}
                </Button>
            </SettingsGroupContent>
        );
    } else if (!enabled) {
        status = (
            <SettingsGroupContent data-testid="l2-settings-not-enabled">
                <Typography>{t('l2.enable-description')}</Typography>
                <Button
                    size="small"
                    variant="black"
                    onClick={enable}
                    disabled={enabling}
                    data-testid="l2-settings-enable"
                >
                    {t('l2.enable')}
                </Button>
                {error && <Typography variant="p">{error}</Typography>}
            </SettingsGroupContent>
        );
    } else {
        status = <Typography data-testid="l2-settings-enabled">{t('l2.enabled')}</Typography>;
    }

    return (
        <>
            <SettingsGroupWrapper>
                <SettingsGroupTitle>
                    <Typography variant="h6">{t('l2.status')}</Typography>
                </SettingsGroupTitle>
                {status}
            </SettingsGroupWrapper>
            {hasPin && enabled && account && (
                <SettingsGroupWrapper data-testid="l2-settings-account">
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('l2.account')}</Typography>
                    </SettingsGroupTitle>
                    <Field label={t('l2.address')} value={account.address} testId="l2-settings-address" />
                    <Field label={t('l2.public-key')} value={account.public_key} testId="l2-settings-public-key" />
                </SettingsGroupWrapper>
            )}
            {indexerUrl && (
                <SettingsGroupWrapper>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('l2.indexer')}</Typography>
                    </SettingsGroupTitle>
                    <Typography data-testid="l2-settings-indexer">{indexerUrl}</Typography>
                </SettingsGroupWrapper>
            )}
            {/* L2 SEED WORDS SECTION: the seed words task inserts its section here. */}
        </>
    );
};

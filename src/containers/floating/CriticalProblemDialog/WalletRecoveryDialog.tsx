import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useErrorDialogsButtonsLogic } from '@app/hooks/app/useErrorDialogsButtonsLogic';
import { useAppStateStore } from '@app/store/appStateStore';
import { setIsSettingsOpen } from '@app/store';
import { WalletRecoveryReason } from '@app/types/events-payloads.ts';
import FindMyWalletsDialog from '../WalletRecovery/FindMyWalletsDialog.tsx';

import { TextWrapper, Wrapper } from './styles.ts';

/**
 * Copy per recovery reason. The backend sends only an enum-like reason, never a message, so no
 * path, id or error string can reach the screen through this dialog.
 */
const COPY_KEYS: Record<WalletRecoveryReason, { title: string; description: string }> = {
    initialization_failed: {
        title: 'common:wallet-recovery-init-failed-title',
        description: 'common:wallet-recovery-init-failed-description',
    },
    seed_unavailable: {
        title: 'common:wallet-recovery-seed-unavailable-title',
        description: 'common:wallet-recovery-seed-unavailable-description',
    },
    // The copy has to say outright that no new wallet was created: from the outside this state
    // looks like an emptied wallet.
    config_corrupted: {
        title: 'common:wallet-recovery-config-corrupted-title',
        description: 'common:wallet-recovery-config-corrupted-description',
    },
    legacy_seed_undecryptable: {
        title: 'common:wallet-recovery-legacy-seed-title',
        description: 'common:wallet-recovery-legacy-seed-description',
    },
    legacy_config_unreadable: {
        title: 'common:wallet-recovery-legacy-config-title',
        description: 'common:wallet-recovery-legacy-config-description',
    },
};

/**
 * Reasons whose seed may still be on this computer under an id the app has lost track of.
 * `initialization_failed` is absent: the configured id is intact there, so offering to re-link it
 * would only confuse. The dialog stays reachable from Settings.
 */
const FIND_MY_WALLETS_REASONS: readonly WalletRecoveryReason[] = [
    'seed_unavailable',
    'config_corrupted',
    'legacy_seed_undecryptable',
    'legacy_config_unreadable',
];

/**
 * Shown when the app cannot vouch for the wallet. Not `CriticalProblemDialog`: the app itself
 * works, so the primary action is opening settings rather than restarting or quitting. Mining and
 * telemetry stay gated in the backend while this is up.
 */
const WalletRecoveryDialog = memo(function WalletRecoveryDialog() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const walletRecovery = useAppStateStore((s) => s.walletRecovery);
    const { isExiting, handleClose, handleRestart } = useErrorDialogsButtonsLogic();
    const [isFindingWallets, setIsFindingWallets] = useState(false);

    const reason = walletRecovery?.reason ?? undefined;
    const copy = reason ? COPY_KEYS[reason] : undefined;
    const canFindWallets = !!reason && FIND_MY_WALLETS_REASONS.includes(reason);

    return (
        <Dialog open={!!reason}>
            <DialogContent>
                <Wrapper>
                    <TextWrapper>
                        <Typography variant="h3">{t(copy?.title || 'common:wallet-recovery-title')}</Typography>
                        <Typography variant="p">
                            {t(copy?.description || 'common:wallet-recovery-description')}
                        </Typography>
                    </TextWrapper>
                    <Stack direction="row" justifyContent="center" gap={8}>
                        {isExiting ? (
                            <CircularProgress />
                        ) : (
                            <Stack direction="row" gap={8} justifyContent="space-between" style={{ width: '100%' }}>
                                <Stack direction="row" gap={8}>
                                    {canFindWallets && (
                                        <Button
                                            size="smaller"
                                            backgroundColor="warning"
                                            onClick={() => setIsFindingWallets(true)}
                                        >
                                            {t('common:find-my-wallets')}
                                        </Button>
                                    )}
                                    <Button
                                        size="smaller"
                                        backgroundColor="info"
                                        onClick={() => setIsSettingsOpen(true)}
                                    >
                                        {t('settings:settings')}
                                    </Button>
                                </Stack>
                                <Stack direction="row" gap={8} justifyContent="space-around">
                                    <Button backgroundColor="error" size="smaller" onClick={handleClose}>
                                        {t('close-tari-universe')}
                                    </Button>
                                    <Button backgroundColor="warning" size="smaller" onClick={handleRestart}>
                                        {t('restart')}
                                    </Button>
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                </Wrapper>
            </DialogContent>
            {canFindWallets && <FindMyWalletsDialog open={isFindingWallets} onOpenChange={setIsFindingWallets} />}
        </Dialog>
    );
});

export default WalletRecoveryDialog;

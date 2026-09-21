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
 * Copy per recovery reason. The backend never sends a message, only an enum-like reason, so the
 * wording (and therefore the redaction) lives entirely here: no path, id or error string from the
 * backend can reach the screen through this dialog.
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
    // The wallet config could not be parsed and neither could its backup. The copy names the two
    // files the backend leaves behind (`config_wallet.json.corrupted.<ts>` and
    // `config_wallet.json.recovery_required`) and says outright that no new wallet was created,
    // because "my wallet is empty" is what this state looks like from the outside.
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
 * Shown when the app cannot vouch for the wallet. Deliberately not `CriticalProblemDialog`: the
 * app is not broken, so the primary action is "open settings" (where the user can export logs and
 * send a support bundle) rather than "restart" or "quit". Telemetry is not running and neither
 * miner will start while this is up; both are gated in the backend.
 */
const WalletRecoveryDialog = memo(function WalletRecoveryDialog() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const walletRecovery = useAppStateStore((s) => s.walletRecovery);
    const { isExiting, handleClose, handleRestart } = useErrorDialogsButtonsLogic();
    // The first thing to try when the wallet cannot be opened or its seed cannot be read: the
    // seed is often still in this computer's credential store under an id the config lost.
    const [isFindingWallets, setIsFindingWallets] = useState(false);

    const copy = walletRecovery ? COPY_KEYS[walletRecovery.reason] : undefined;

    return (
        <Dialog open={!!walletRecovery}>
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
                                    <Button
                                        size="smaller"
                                        backgroundColor="warning"
                                        onClick={() => setIsFindingWallets(true)}
                                    >
                                        {t('common:find-my-wallets')}
                                    </Button>
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
            <FindMyWalletsDialog open={isFindingWallets} onOpenChange={setIsFindingWallets} />
        </Dialog>
    );
});

export default WalletRecoveryDialog;

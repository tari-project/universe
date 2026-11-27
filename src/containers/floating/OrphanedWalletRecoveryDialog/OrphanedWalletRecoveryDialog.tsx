import { memo, useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { splitSeedWordsInput } from '@app/components/wallet/seedwords/components/Edit.tsx';
import { useErrorDialogsButtonsLogic } from '@app/hooks/app/useErrorDialogsButtonsLogic';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard';
import { setIsSettingsOpen, setOrphanedWalletRecovery } from '@app/store';
import { useAppStateStore } from '@app/store/appStateStore';
import { OrphanedWalletCandidate } from '@app/types/events-payloads';
import {
    AddressCode,
    CandidateList,
    CandidateRow,
    ErrorBanner,
    SectionBox,
    SeedTextArea,
    TextInput,
    TextWrapper,
    Wrapper,
} from './styles';

const OrphanedWalletRecoveryDialog = memo(function OrphanedWalletRecoveryDialog() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const recovery = useAppStateStore((s) => s.orphanedWalletRecovery);
    const { isExiting, handleClose, handleRestart } = useErrorDialogsButtonsLogic();
    const { copyToClipboard } = useCopyToClipboard();

    const [candidates, setCandidates] = useState<OrphanedWalletCandidate[]>([]);
    const [pinProtectedCount, setPinProtectedCount] = useState(0);
    const [unlockedPins, setUnlockedPins] = useState<Record<string, string>>({});
    const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);
    const [showSeedImport, setShowSeedImport] = useState(false);
    const [seedInput, setSeedInput] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    useEffect(() => {
        if (!recovery) {
            setCandidates([]);
            setPinProtectedCount(0);
            setUnlockedPins({});
            setRevealedIds({});
            setPinInput('');
            setPinError(null);
            setShowSeedImport(false);
            setSeedInput('');
            setActionError(null);
            setIsBusy(false);
            return;
        }
        setCandidates(recovery.plain_candidates);
        setPinProtectedCount(recovery.pin_protected_count);
        setUnlockedPins({});
        setRevealedIds({});
        setPinInput('');
        setPinError(null);
        setActionError(null);
    }, [recovery]);

    const toggleRevealAddress = useCallback((walletId: string) => {
        setRevealedIds((prev) => ({ ...prev, [walletId]: !prev[walletId] }));
    }, []);

    const handleUnlockWithPin = useCallback(async () => {
        if (!pinInput.trim() || isBusy) return;
        setIsBusy(true);
        setPinError(null);
        setActionError(null);
        try {
            const submittedPin = pinInput;
            const unlocked = await invoke('unlock_orphaned_wallet_candidates', { pin: submittedPin });
            if (!unlocked || unlocked.length === 0) {
                setPinError(t('common:orphaned-wallet-pin-no-match'));
            } else {
                setCandidates((prev) => {
                    const existingIds = new Set(prev.map((c) => c.wallet_id));
                    const fresh = unlocked.filter((c) => !existingIds.has(c.wallet_id));
                    return [...prev, ...fresh];
                });
                setUnlockedPins((prev) => {
                    const next = { ...prev };
                    for (const item of unlocked) {
                        next[item.wallet_id] = submittedPin;
                    }
                    return next;
                });
                setPinProtectedCount((prev) => Math.max(0, prev - unlocked.length));
                setPinInput('');
            }
        } catch (e) {
            console.error('Error unlocking orphaned wallet candidates:', e);
            setPinError(String(e));
        } finally {
            setIsBusy(false);
        }
    }, [isBusy, pinInput, t]);

    const handleRestoreCandidate = useCallback(
        async (walletId: string) => {
            if (isBusy) return;
            setIsBusy(true);
            setActionError(null);
            try {
                const pin = unlockedPins[walletId];
                await invoke('restore_orphaned_wallet_candidate', {
                    walletId,
                    ...(pin ? { pin } : {}),
                });
                setOrphanedWalletRecovery();
            } catch (e) {
                console.error('Error restoring orphaned wallet candidate:', e);
                setActionError(String(e));
            } finally {
                setIsBusy(false);
            }
        },
        [isBusy, unlockedPins]
    );

    const handleImportSeedWords = useCallback(async () => {
        const words = splitSeedWordsInput(seedInput);
        if (words.length !== 24 || isBusy) return;
        setIsBusy(true);
        setActionError(null);
        try {
            await invoke('import_seed_words', { seedWords: words });
            setOrphanedWalletRecovery();
        } catch (e) {
            console.error('Error importing seed words from recovery dialog:', e);
            setActionError(String(e));
        } finally {
            setIsBusy(false);
        }
    }, [isBusy, seedInput]);

    const handleStartFresh = useCallback(async () => {
        if (isBusy) return;
        setIsBusy(true);
        setActionError(null);
        try {
            await invoke('discard_unreadable_wallet_config');
            setOrphanedWalletRecovery();
        } catch (e) {
            console.error('Error starting fresh from orphaned wallet recovery dialog:', e);
            setActionError(String(e));
        } finally {
            setIsBusy(false);
        }
    }, [isBusy]);

    const seedWordsCount = splitSeedWordsInput(seedInput).length;

    return (
        <Dialog open={!!recovery}>
            <DialogContent>
                <Wrapper>
                    <TextWrapper>
                        <Typography variant="h3">{t('common:orphaned-wallet-recovery-title')}</Typography>
                        <Typography variant="p">{t('common:orphaned-wallet-recovery-description')}</Typography>
                    </TextWrapper>

                    {candidates.length > 0 && (
                        <CandidateList>
                            {candidates.map((candidate) => {
                                const isRevealed = !!revealedIds[candidate.wallet_id];
                                return (
                                    <CandidateRow
                                        key={candidate.wallet_id}
                                        data-testid={`orphaned-wallet-candidate-${candidate.wallet_id}`}
                                    >
                                        <AddressCode>
                                            {isRevealed ? candidate.full_address : candidate.redacted_address}
                                        </AddressCode>
                                        <Stack direction="row" gap={8} justifyContent="space-between">
                                            <Stack direction="row" gap={8}>
                                                <Button
                                                    size="smaller"
                                                    backgroundColor="info"
                                                    onClick={() => toggleRevealAddress(candidate.wallet_id)}
                                                >
                                                    {t(
                                                        isRevealed
                                                            ? 'common:orphaned-wallet-hide-address'
                                                            : 'common:orphaned-wallet-reveal-address'
                                                    )}
                                                </Button>
                                                <Button
                                                    size="smaller"
                                                    backgroundColor="info"
                                                    onClick={() => copyToClipboard(candidate.full_address)}
                                                >
                                                    {t('common:orphaned-wallet-copy-address')}
                                                </Button>
                                            </Stack>
                                            <Button
                                                size="smaller"
                                                backgroundColor="warning"
                                                disabled={isBusy || isExiting}
                                                onClick={() => handleRestoreCandidate(candidate.wallet_id)}
                                            >
                                                {t('common:orphaned-wallet-restore')}
                                            </Button>
                                        </Stack>
                                    </CandidateRow>
                                );
                            })}
                        </CandidateList>
                    )}

                    {pinProtectedCount > 0 && (
                        <SectionBox data-testid="orphaned-wallet-pin-section">
                            <Typography variant="p">
                                {t('common:orphaned-wallet-pin-count', { count: pinProtectedCount })}
                            </Typography>
                            <Stack direction="row" gap={8}>
                                <TextInput
                                    type="password"
                                    value={pinInput}
                                    onChange={(e) => setPinInput(e.target.value)}
                                    placeholder={t('common:orphaned-wallet-pin-placeholder')}
                                    data-testid="orphaned-wallet-pin-input"
                                />
                                <Button
                                    size="smaller"
                                    backgroundColor="info"
                                    disabled={!pinInput.trim() || isBusy || isExiting}
                                    onClick={handleUnlockWithPin}
                                    data-testid="orphaned-wallet-pin-submit"
                                >
                                    {t('common:orphaned-wallet-unlock-pin')}
                                </Button>
                            </Stack>
                            {pinError && <ErrorBanner>{pinError}</ErrorBanner>}
                        </SectionBox>
                    )}

                    {showSeedImport && (
                        <SectionBox data-testid="orphaned-wallet-seed-section">
                            <SeedTextArea
                                value={seedInput}
                                onChange={(e) => setSeedInput(e.target.value)}
                                placeholder={t('common:orphaned-wallet-seed-placeholder')}
                                data-testid="orphaned-wallet-seed-input"
                            />
                            <Stack direction="row" justifyContent="flex-end" gap={8}>
                                <Button
                                    size="smaller"
                                    backgroundColor="warning"
                                    disabled={seedWordsCount !== 24 || isBusy || isExiting}
                                    onClick={handleImportSeedWords}
                                    data-testid="orphaned-wallet-seed-submit"
                                >
                                    {t('common:orphaned-wallet-seed-submit')}
                                </Button>
                            </Stack>
                        </SectionBox>
                    )}

                    {actionError && <ErrorBanner>{actionError}</ErrorBanner>}

                    <Stack direction="row" justifyContent="center" gap={8}>
                        {isExiting || isBusy ? (
                            <CircularProgress />
                        ) : (
                            <Stack direction="row" gap={8} justifyContent="space-between" style={{ width: '100%' }}>
                                <Stack direction="row" gap={8}>
                                    <Button
                                        size="smaller"
                                        backgroundColor="info"
                                        onClick={() => setIsSettingsOpen(true)}
                                    >
                                        {t('settings:settings')}
                                    </Button>
                                    <Button
                                        size="smaller"
                                        backgroundColor="info"
                                        onClick={() => setShowSeedImport((prev) => !prev)}
                                    >
                                        {t('common:orphaned-wallet-seed-import')}
                                    </Button>
                                </Stack>
                                <Stack direction="row" gap={8} justifyContent="space-around">
                                    <Button backgroundColor="info" size="smaller" onClick={handleStartFresh}>
                                        {t('common:wallet-config-missing-start-fresh')}
                                    </Button>
                                    <Button backgroundColor="error" size="smaller" onClick={handleClose}>
                                        {t('common:close-tari-universe')}
                                    </Button>
                                    <Button backgroundColor="warning" size="smaller" onClick={handleRestart}>
                                        {t('common:restart')}
                                    </Button>
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
});

export default OrphanedWalletRecoveryDialog;

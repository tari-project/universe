import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useFindMyWallets } from '@app/hooks/wallet/useFindMyWallets.ts';
import { FoundWallet } from '@app/types/wallet-recovery.ts';

import {
    AddressPrefix,
    ConfirmPanel,
    TextWrapper,
    WalletEntry,
    WalletLabel,
    WalletList,
    WalletRow,
    Wrapper,
} from './styles.ts';

interface FindMyWalletsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Lists the wallet seeds this machine's credential store still holds and lets the user pick one.
 * The backend sends only an id, an 8-character address prefix and link flags, so there is nothing
 * sensitive to render here.
 */
const FindMyWalletsDialog = memo(function FindMyWalletsDialog({ open, onOpenChange }: FindMyWalletsDialogProps) {
    const { t } = useTranslation('common', { useSuspense: false });
    const { result, isSearching, relinkingId, error, search, relink } = useFindMyWallets();
    // Switching wallets wipes the local scan database, so the row asks first rather than acting on
    // one click. Confirming in place keeps this from stacking a third floating dialog.
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    const statusLabel = (wallet: FoundWallet) => {
        if (wallet.is_active) return t('find-my-wallets-status-active');
        if (wallet.is_linked) return t('find-my-wallets-status-linked');
        switch (wallet.status) {
            case 'readable':
                return t('find-my-wallets-status-found');
            case 'pin_required':
                return t('find-my-wallets-status-pin-required');
            default:
                return t('find-my-wallets-status-unreadable');
        }
    };

    const handleSearch = () => {
        setConfirmingId(null);
        void search();
    };

    const handleConfirm = (walletId: string) => {
        setConfirmingId(null);
        void relink(walletId);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <Wrapper>
                    <TextWrapper>
                        <Typography variant="h3">{t('find-my-wallets-title')}</Typography>
                        <Typography variant="p">{t('find-my-wallets-description')}</Typography>
                    </TextWrapper>

                    {isSearching ? (
                        <Stack direction="row" justifyContent="center">
                            <CircularProgress />
                        </Stack>
                    ) : null}

                    {!isSearching && result?.kind === 'unsupported' ? (
                        <Typography variant="p">{t('find-my-wallets-unsupported')}</Typography>
                    ) : null}

                    {!isSearching && result?.kind === 'found' && result.wallets.length === 0 ? (
                        <Typography variant="p">{t('find-my-wallets-none')}</Typography>
                    ) : null}

                    {!isSearching && result?.kind === 'found' && result.wallets.length > 0 ? (
                        <WalletList>
                            {result.wallets.map((wallet) => (
                                <WalletEntry key={wallet.wallet_id}>
                                    <WalletRow>
                                        <WalletLabel>
                                            <AddressPrefix>
                                                {wallet.address_prefix
                                                    ? `${wallet.address_prefix}...`
                                                    : t('find-my-wallets-unknown-address')}
                                            </AddressPrefix>
                                            <Typography variant="p">{statusLabel(wallet)}</Typography>
                                        </WalletLabel>
                                        {confirmingId === wallet.wallet_id ? (
                                            <Stack direction="row" gap={8}>
                                                <Button
                                                    size="smaller"
                                                    backgroundColor="warning"
                                                    onClick={() => handleConfirm(wallet.wallet_id)}
                                                >
                                                    {t('find-my-wallets-confirm')}
                                                </Button>
                                                <Button
                                                    size="smaller"
                                                    variant="black"
                                                    onClick={() => setConfirmingId(null)}
                                                >
                                                    {t('cancel')}
                                                </Button>
                                            </Stack>
                                        ) : (
                                            <Button
                                                size="smaller"
                                                variant="black"
                                                disabled={
                                                    wallet.is_active ||
                                                    wallet.status !== 'readable' ||
                                                    relinkingId !== null
                                                }
                                                onClick={() => setConfirmingId(wallet.wallet_id)}
                                            >
                                                {relinkingId === wallet.wallet_id
                                                    ? t('find-my-wallets-using')
                                                    : t('find-my-wallets-use')}
                                            </Button>
                                        )}
                                    </WalletRow>
                                    {confirmingId === wallet.wallet_id ? (
                                        <ConfirmPanel>
                                            <Typography variant="p">
                                                {t('find-my-wallets-confirm-description', {
                                                    prefix:
                                                        wallet.address_prefix ?? t('find-my-wallets-unknown-address'),
                                                })}
                                            </Typography>
                                        </ConfirmPanel>
                                    ) : null}
                                </WalletEntry>
                            ))}
                        </WalletList>
                    ) : null}

                    {error ? <Typography variant="p">{t(error.key, { seconds: error.seconds })}</Typography> : null}

                    <Stack direction="row" gap={8} justifyContent="space-between" style={{ width: '100%' }}>
                        <Button
                            size="smaller"
                            backgroundColor="info"
                            disabled={isSearching || relinkingId !== null}
                            onClick={handleSearch}
                        >
                            {result ? t('find-my-wallets-search-again') : t('find-my-wallets-search')}
                        </Button>
                        <Button size="smaller" variant="black" onClick={() => onOpenChange(false)}>
                            {t('close')}
                        </Button>
                    </Stack>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
});

export default FindMyWalletsDialog;

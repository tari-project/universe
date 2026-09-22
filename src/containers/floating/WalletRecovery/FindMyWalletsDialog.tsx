import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useFindMyWallets } from '@app/hooks/wallet/useFindMyWallets.ts';
import { FoundWallet } from '@app/types/wallet-recovery.ts';

import { AddressPrefix, TextWrapper, WalletLabel, WalletList, WalletRow, Wrapper } from './styles.ts';

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
                                <WalletRow key={wallet.wallet_id}>
                                    <WalletLabel>
                                        <AddressPrefix>
                                            {wallet.address_prefix
                                                ? `${wallet.address_prefix}...`
                                                : t('find-my-wallets-unknown-address')}
                                        </AddressPrefix>
                                        <Typography variant="p">{statusLabel(wallet)}</Typography>
                                    </WalletLabel>
                                    <Button
                                        size="smaller"
                                        variant="black"
                                        disabled={
                                            wallet.is_active || wallet.status !== 'readable' || relinkingId !== null
                                        }
                                        onClick={() => relink(wallet.wallet_id)}
                                    >
                                        {relinkingId === wallet.wallet_id
                                            ? t('find-my-wallets-using')
                                            : t('find-my-wallets-use')}
                                    </Button>
                                </WalletRow>
                            ))}
                        </WalletList>
                    ) : null}

                    {error ? <Typography variant="p">{error}</Typography> : null}

                    <Stack direction="row" gap={8} justifyContent="space-between" style={{ width: '100%' }}>
                        <Button size="smaller" backgroundColor="info" disabled={isSearching} onClick={search}>
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

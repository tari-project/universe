import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { invoke } from '@tauri-apps/api/core';
import { IoCheckmarkOutline } from 'react-icons/io5';
import { QRCode } from 'react-qrcode-logo';
import { CopySVG } from '@app/assets/icons/copy';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import type { L2Account } from '@app/types/events-payloads.ts';
import { formatNumber, FormatPreset, truncateMiddle } from '@app/utils';
import { Typography } from '@app/components/elements/Typography.tsx';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { WalletWrapper, TabsWrapper } from '@app/components/wallet/sidebarWallet/wallet.styles.ts';
import {
    AnimatedBG,
    BottomContent,
    Content,
    DetailsCard,
} from '@app/components/wallet/sidebarWallet/details.styles.ts';
import { Actions, Name, Wrapper as DetailsRow } from '@app/components/wallet/components/details/styles.ts';
import { ActionButton } from '@app/components/wallet/components/details/actions/styles.ts';
import {
    BalanceTextWrapper,
    BottomWrapper,
    Hidden,
    SuffixWrapper,
    Wrapper as BalanceWrapper,
} from '@app/components/wallet/components/balance/styles.ts';
import { BurnHint, NavButton, NavWrapper } from '@app/components/wallet/components/actions/styles.ts';
import BurnModal from '@app/components/transactions/burn/BurnModal.tsx';
import { Wrapper as ReceiveWrapper } from '@app/components/transactions/receive/receive.styles.ts';
import {
    AddressContainer,
    AddressWrapper,
    CopyAddressButton,
    Label,
    QRContainer,
    QROutside,
    QRSizer,
} from '@app/components/transactions/receive/Address.style.ts';
import { FilterSelect } from '@app/components/transactions/history/FilterSelect.tsx';
import L2Activity from './L2Activity.tsx';
import L2SendModal from './L2SendModal.tsx';

const FILTER_TYPES = ['all-activity', 'transactions', 'l2.filter.waiting-claims'] as const;

const EMPTY_BALANCE = { revealed: 0, confidential: 0 };

// Derives the default L2 claim public key locally when no L2 account is available yet (pre-launch).
function useDefaultClaimKey(account?: L2Account): string | undefined {
    const [defaultClaimKey, setDefaultClaimKey] = useState<string>();

    useEffect(() => {
        if (account) return;
        let ignore = false;
        invoke<string>('l2_default_claim_public_key')
            .then((key) => {
                if (!ignore) setDefaultClaimKey(key);
            })
            .catch((e) => console.warn('Could not derive the default L2 claim key:', e));
        return () => {
            ignore = true;
        };
    }, [account]);

    return account ? account.public_key : defaultClaimKey;
}

function resolveAccountDisplayName(account: L2Account | undefined, t: TFunction): string {
    if (!account || account.is_default) {
        return t('l2.account-name');
    }
    return account.name || t('l2.title');
}

function formatL2Amount(value: number, hideBalance: boolean): string {
    return hideBalance ? '*******' : formatNumber(value, FormatPreset.XTM_LONG);
}

function L2BalanceCard({
    account,
    isCopied,
    onCopyAddress,
}: {
    account?: L2Account;
    isCopied: boolean;
    onCopyAddress: (address: string) => void;
}) {
    const { t } = useTranslation('wallet');
    const hideBalance = useUIStore((s) => s.hideWalletBalance);
    const { revealed, confidential } = account?.balance ?? EMPTY_BALANCE;
    const totalFormatted = formatL2Amount(revealed + confidential, hideBalance);

    return (
        <DetailsCard $isScrolled={false}>
            <AnimatedBG $col1="#2b1d5a" $col2="#4c2c8f" />
            <Content>
                <DetailsRow>
                    <Name>{resolveAccountDisplayName(account, t)}</Name>
                    {account && (
                        <Actions>
                            <ActionButton
                                onClick={() => onCopyAddress(account.address)}
                                title={account.address}
                                data-testid="l2-copy-address"
                            >
                                {isCopied ? <IoCheckmarkOutline /> : <CopySVG />}
                            </ActionButton>
                        </Actions>
                    )}
                </DetailsRow>
                <BottomContent>
                    <BalanceWrapper
                        data-testid="l2-balance"
                        data-balance={hideBalance ? undefined : account?.balance.total}
                    >
                        <BalanceTextWrapper>
                            {hideBalance ? <Hidden>{`*******`}</Hidden> : totalFormatted}
                            <SuffixWrapper>{` TARI`}</SuffixWrapper>
                        </BalanceTextWrapper>
                        <BottomWrapper>
                            <Typography>
                                {t('l2.balance-split', {
                                    revealed: formatL2Amount(revealed, hideBalance),
                                    confidential: formatL2Amount(confidential, hideBalance),
                                })}
                            </Typography>
                        </BottomWrapper>
                    </BalanceWrapper>
                </BottomContent>
            </Content>
        </DetailsCard>
    );
}

function L2ReceiveModal({
    address,
    show,
    isCopied,
    onClose,
    onCopyAddress,
}: {
    address: string;
    show: boolean;
    isCopied: boolean;
    onClose: () => void;
    onCopyAddress: (address: string) => void;
}) {
    const { t } = useTranslation('wallet');
    return (
        <TransactionModal show={show} title={t('l2.receive-title')} handleClose={onClose}>
            <ReceiveWrapper>
                <QRContainer>
                    <QROutside>
                        <QRSizer>
                            <QRCode
                                value={address}
                                ecLevel="H"
                                size={400}
                                quietZone={20}
                                qrStyle="dots"
                                eyeRadius={12}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </QRSizer>
                    </QROutside>
                    <AddressContainer>
                        <Label>{t('receive.label-address')}</Label>
                        <AddressWrapper title={address}>{truncateMiddle(address, 10)}</AddressWrapper>
                    </AddressContainer>
                </QRContainer>
                <CopyAddressButton onClick={() => onCopyAddress(address)} $isCopied={isCopied}>
                    {isCopied ? t('receive.copy-address-success') : t('receive.copy-address')}
                </CopyAddressButton>
            </ReceiveWrapper>
        </TransactionModal>
    );
}

/** With no `account` it is the pre-launch wallet: zero balance, no activity, Send and Receive off,
 * and Burn claiming to the key the default account will get. */
export default function L2Wallet({ account }: { account?: L2Account }) {
    const { t } = useTranslation('wallet');
    const [section, setSection] = useState('history');
    const [filter, setFilter] = useState<string>('all-activity');
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    // A burn spends L1 funds, so it waits on the L1 wallet like the L1 send does.
    const isL1Scanning = useWalletStore((s) => !s.wallet_scanning.is_initial_scan_complete);
    const pinLocked = useWalletStore((s) => s.is_pin_locked);
    const hasPin = pinLocked === true;
    // Only display the "PIN required" hint when the backend has confirmed no PIN is configured,
    // avoiding a premature warning while `is_pin_locked` is still `undefined`.
    const pinHint = pinLocked === false ? t('burn.pin-required') : undefined;
    const claimPublicKey = useDefaultClaimKey(account);
    const canBurn = !isL1Scanning && hasPin && Boolean(claimPublicKey);

    return (
        <WalletWrapper style={{ minHeight: 0 }} data-testid="l2-wallet">
            <L2BalanceCard account={account} isCopied={isCopied} onCopyAddress={copyToClipboard} />

            <TabsWrapper>
                <FilterSelect types={FILTER_TYPES} value={filter} onChange={setFilter} testId="l2-history-filter" />
                <NavWrapper>
                    <NavButton
                        $isActive={section === 'send'}
                        aria-selected={section === 'send'}
                        onClick={() => setSection('send')}
                        disabled={!account}
                        data-testid="l2-send-button"
                    >
                        {t('tabs.send')}
                    </NavButton>
                    <NavButton
                        $isActive={section === 'receive'}
                        aria-selected={section === 'receive'}
                        onClick={() => setSection('receive')}
                        disabled={!account}
                        data-testid="l2-receive-button"
                    >
                        {t('tabs.receive')}
                    </NavButton>
                    {/* The disabled button ignores the pointer, so the hint sits on a wrapper. */}
                    <BurnHint title={pinHint}>
                        <NavButton
                            $isActive={section === 'burn'}
                            aria-selected={section === 'burn'}
                            onClick={() => setSection('burn')}
                            disabled={!canBurn}
                            aria-label={pinHint}
                            data-testid="l2-burn-button"
                        >
                            {t('tabs.burn')}
                        </NavButton>
                    </BurnHint>
                </NavWrapper>
            </TabsWrapper>

            {/* Its own scroll area, so a long list can't push the card past the window. */}
            <div style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto' }}>
                <L2Activity account={account} filter={filter} />
            </div>

            {/* Mounted only while open, like BurnModal, so a send that finishes after the X can't leave a stale Submitted screen. */}
            {section === 'send' && account && (
                <L2SendModal show account={account.component_address} onClose={() => setSection('history')} />
            )}

            {section === 'burn' && claimPublicKey && (
                <BurnModal section={section} setSection={setSection} claimPublicKey={claimPublicKey} />
            )}

            {account && (
                <L2ReceiveModal
                    address={account.address}
                    show={section === 'receive'}
                    isCopied={isCopied}
                    onClose={() => setSection('history')}
                    onCopyAddress={copyToClipboard}
                />
            )}
        </WalletWrapper>
    );
}

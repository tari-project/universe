import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

/** With no `account` it is the pre-launch wallet: zero balance, no activity, Send and Receive off,
 * and Burn claiming to the key the default account will get. */
export default function L2Wallet({ account }: { account?: L2Account }) {
    const { t } = useTranslation('wallet');
    const [section, setSection] = useState('history');
    const [filter, setFilter] = useState<string>('all-activity');
    const hideBalance = useUIStore((s) => s.hideWalletBalance);
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    // A burn spends L1 funds, so it waits on the L1 wallet like the L1 send does.
    const isL1Scanning = useWalletStore((s) => !s.wallet_scanning.is_initial_scan_complete);
    const pinLocked = useWalletStore((s) => s.is_pin_locked);
    const hasPin = pinLocked === true;
    const noPinSet = pinLocked === false;
    const [defaultClaimKey, setDefaultClaimKey] = useState<string>();
    const claimPublicKey = account ? account.public_key : defaultClaimKey;

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

    const { revealed, confidential } = account?.balance ?? EMPTY_BALANCE;
    const xtr = (value: number) => (hideBalance ? '*******' : formatNumber(value, FormatPreset.XTM_LONG));

    return (
        <WalletWrapper style={{ minHeight: 0 }} data-testid="l2-wallet">
            <DetailsCard $isScrolled={false}>
                <AnimatedBG $col1="#2b1d5a" $col2="#4c2c8f" />
                <Content>
                    <DetailsRow>
                        <Name>
                            {!account || account.is_default ? t('l2.account-name') : account.name || t('l2.title')}
                        </Name>
                        {account && (
                            <Actions>
                                <ActionButton
                                    onClick={() => copyToClipboard(account.address)}
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
                                {hideBalance ? <Hidden>{`*******`}</Hidden> : xtr(revealed + confidential)}
                                <SuffixWrapper>{` TARI`}</SuffixWrapper>
                            </BalanceTextWrapper>
                            <BottomWrapper>
                                <Typography>
                                    {t('l2.balance-split', {
                                        revealed: xtr(revealed),
                                        confidential: xtr(confidential),
                                    })}
                                </Typography>
                            </BottomWrapper>
                        </BalanceWrapper>
                    </BottomContent>
                </Content>
            </DetailsCard>

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
                    <BurnHint title={noPinSet ? t('burn.pin-required') : undefined}>
                        <NavButton
                            $isActive={section === 'burn'}
                            aria-selected={section === 'burn'}
                            onClick={() => setSection('burn')}
                            disabled={isL1Scanning || !hasPin || !claimPublicKey}
                            aria-label={noPinSet ? t('burn.pin-required') : undefined}
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
                <TransactionModal
                    show={section === 'receive'}
                    title={t('l2.receive-title')}
                    handleClose={() => setSection('history')}
                >
                    <ReceiveWrapper>
                        <QRContainer>
                            <QROutside>
                                <QRSizer>
                                    <QRCode
                                        value={account.address}
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
                                <AddressWrapper title={account.address}>
                                    {truncateMiddle(account.address, 10)}
                                </AddressWrapper>
                            </AddressContainer>
                        </QRContainer>
                        <CopyAddressButton onClick={() => copyToClipboard(account.address)} $isCopied={isCopied}>
                            {isCopied ? t('receive.copy-address-success') : t('receive.copy-address')}
                        </CopyAddressButton>
                    </ReceiveWrapper>
                </TransactionModal>
            )}
        </WalletWrapper>
    );
}

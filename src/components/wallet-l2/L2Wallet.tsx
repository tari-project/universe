import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import L2ClaimBurns from './L2ClaimBurns.tsx';
import L2History from './L2History.tsx';
import L2SendModal from './L2SendModal.tsx';

const FILTER_TYPES = ['all-activity', 'transactions', 'l2.filter.waiting-claims'] as const;

export default function L2Wallet({ account }: { account: L2Account }) {
    const { t } = useTranslation('wallet');
    const [section, setSection] = useState('history');
    const [filter, setFilter] = useState<string>('all-activity');
    const hideBalance = useUIStore((s) => s.hideWalletBalance);
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    // A burn spends L1 funds, so it waits on the L1 wallet like the L1 send does.
    const isL1Scanning = useWalletStore((s) => !s.wallet_scanning.is_initial_scan_complete);
    const hasPin = useWalletStore((s) => s.is_pin_locked);

    const { revealed, confidential } = account.balance;
    const xtr = (value: number) => (hideBalance ? '*******' : formatNumber(value, FormatPreset.XTM_LONG));

    return (
        <WalletWrapper data-testid="l2-wallet">
            <DetailsCard $isScrolled={false}>
                <AnimatedBG $col1="#2b1d5a" $col2="#4c2c8f" />
                <Content>
                    <DetailsRow>
                        <Name>{account.is_default ? t('l2.account-name') : account.name || t('l2.title')}</Name>
                        <Actions>
                            <ActionButton
                                onClick={() => copyToClipboard(account.address)}
                                title={account.address}
                                data-testid="l2-copy-address"
                            >
                                {isCopied ? <IoCheckmarkOutline /> : <CopySVG />}
                            </ActionButton>
                        </Actions>
                    </DetailsRow>
                    <BottomContent>
                        <BalanceWrapper data-testid="l2-balance">
                            <BalanceTextWrapper>
                                {hideBalance ? <Hidden>{`*******`}</Hidden> : xtr(revealed + confidential)}
                                <SuffixWrapper>{` XTR`}</SuffixWrapper>
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
                <FilterSelect types={FILTER_TYPES} value={filter} onChange={setFilter} />
                <NavWrapper>
                    <NavButton
                        $isActive={section === 'send'}
                        aria-selected={section === 'send'}
                        onClick={() => setSection('send')}
                        data-testid="l2-send-button"
                    >
                        {t('tabs.send')}
                    </NavButton>
                    <NavButton
                        $isActive={section === 'receive'}
                        aria-selected={section === 'receive'}
                        onClick={() => setSection('receive')}
                        data-testid="l2-receive-button"
                    >
                        {t('tabs.receive')}
                    </NavButton>
                    {/* The disabled button ignores the pointer, so the hint sits on a wrapper. */}
                    <BurnHint title={hasPin ? undefined : t('burn.pin-required')}>
                        <NavButton
                            $isActive={section === 'burn'}
                            aria-selected={section === 'burn'}
                            onClick={() => setSection('burn')}
                            disabled={isL1Scanning || !hasPin}
                            aria-label={hasPin ? undefined : t('burn.pin-required')}
                            data-testid="l2-burn-button"
                        >
                            {t('tabs.burn')}
                        </NavButton>
                    </BurnHint>
                </NavWrapper>
            </TabsWrapper>

            {filter !== 'transactions' && <L2ClaimBurns account={account} />}

            {filter !== 'l2.filter.waiting-claims' && <L2History account={account} />}

            <L2SendModal
                show={section === 'send'}
                account={account.component_address}
                onClose={() => setSection('history')}
            />

            {section === 'burn' && (
                <BurnModal section={section} setSection={setSection} claimPublicKey={account.public_key} />
            )}

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
        </WalletWrapper>
    );
}

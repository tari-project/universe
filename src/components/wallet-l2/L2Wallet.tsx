import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoCheckmarkOutline } from 'react-icons/io5';
import { QRCode } from 'react-qrcode-logo';
import { CopySVG } from '@app/assets/icons/copy';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
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
    SuffixWrapper,
    Wrapper as BalanceWrapper,
} from '@app/components/wallet/components/balance/styles.ts';
import { NavButton, NavWrapper } from '@app/components/wallet/components/actions/styles.ts';
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
import L2History from './L2History.tsx';

export default function L2Wallet({ account }: { account: L2Account }) {
    const { t } = useTranslation('wallet');
    const [section, setSection] = useState('history');
    const hideBalance = useUIStore((s) => s.hideWalletBalance);
    const { copyToClipboard, isCopied } = useCopyToClipboard();

    const { revealed, confidential } = account.balance;
    const xtr = (value: number) => (hideBalance ? '*******' : formatNumber(value, FormatPreset.XTM_LONG));

    return (
        <WalletWrapper data-testid="l2-wallet">
            <DetailsCard $isScrolled={false}>
                <AnimatedBG $col1="#0B0A0D" $col2="#6F8309" />
                <Content>
                    <DetailsRow>
                        <Name>{account.name || t('l2.title')}</Name>
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
                                {xtr(revealed + confidential)}
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
                <NavWrapper>
                    <NavButton
                        $isActive={section === 'history'}
                        aria-selected={section === 'history'}
                        onClick={() => setSection('history')}
                    >
                        {t('tabs.history')}
                    </NavButton>
                    <NavButton
                        $isActive={section === 'receive'}
                        aria-selected={section === 'receive'}
                        onClick={() => setSection('receive')}
                        data-testid="l2-receive-button"
                    >
                        {t('tabs.receive')}
                    </NavButton>
                </NavWrapper>
            </TabsWrapper>

            <L2History account={account} />

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

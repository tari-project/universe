import {
    BackButton,
    ConnectedWalletWrapper,
    CurrentStep,
    HeaderItem,
    HeaderWrapper,
    SectionHeaderWrapper,
    StepHeader,
    SubmitButtonWrapper,
    SwapAmountInput,
    SwapDirection,
    SwapDirectionWrapper,
    SwapOption,
    SwapOptionAmount,
    SwapOptionCurrency,
    SwapErrorMessage,
    SwapsContainer,
} from './Swap.styles';
import { useAccount } from 'wagmi';
import { getCurrencyIcon } from '@app/containers/floating/SwapDialogs/helpers/getIcon';
import { ArrowIcon } from '@app/containers/floating/SwapDialogs/icons/elements/ArrowIcon';
import { WalletButton } from '@app/containers/floating/SwapDialogs/components/WalletButton/WalletButton';
import { ConnectWallet } from '@app/containers/floating/SwapDialogs/sections/ConnectWallet/ConnectWallet';
import { HeaderLabel, TabHeader } from '../../components/Tabs/tab.styles';
import { SwapConfirmation } from '@app/containers/floating/SwapDialogs/sections/SwapConfirmation/SwapConfirmation';
import { ProcessingTransaction } from '@app/containers/floating/SwapDialogs/sections/ProcessingTransaction/ProcessingTransaction';

import { ChevronSVG } from '@app/assets/icons/chevron';
import { useSwapData } from './useSwapData';
import { TokenSelection } from '@app/containers/floating/SwapDialogs/sections/TokenSelection/TokenSelection';
import { truncateMiddle } from '@app/utils';
import { useMemo, useState } from 'react';
import { WalletContents } from '@app/containers/floating/SwapDialogs/sections/WalletContents/WalletContents';
import { SignApprovalMessage } from '@app/containers/floating/SwapDialogs/sections/SignMessage/SignApprovalMessage';
import { useTranslation } from 'react-i18next';

interface Props {
    setSwapUiVisible: (isVisible: boolean) => void;
}

export const Swap = ({ setSwapUiVisible }: Props) => {
    const [openWallet, setOpenWallet] = useState(false);
    const connectedAccount = useAccount();
    const { t } = useTranslation(['wallet'], { useSuspense: false });

    const {
        notEnoughBalance,
        fromTokenDisplay,
        toTokenDisplay,
        reviewSwap,
        isLoading,
        processingOpen,
        isProcessingApproval,
        isProcessingSwap,
        swapSuccess,
        ethTokenAmount,
        wxtmAmount,
        uiDirection,
        transaction,
        tokenSelectOpen,
        selectableFromTokens,
        error,
        useSwapError,
        insufficientLiquidity,
        setProcessingOpen,
        setFromAmount,
        setTargetAmount,
        setReviewSwap,
        handleToggleUiDirection,
        handleConfirm,
        setTokenSelectOpen,
        handleSelectFromToken,
    } = useSwapData();

    const errorMsg = useSwapError || error;

    const disabled = useMemo(() => {
        const hasAmount = Number(ethTokenAmount || wxtmAmount);
        return Boolean(isLoading || !hasAmount || insufficientLiquidity || notEnoughBalance);
    }, [isLoading, notEnoughBalance, insufficientLiquidity, ethTokenAmount, wxtmAmount]);

    return (
        <SwapsContainer>
            <TabHeader $noBorder>
                <SectionHeaderWrapper>
                    <HeaderLabel>{t('swap.buy-tari')}</HeaderLabel>
                    <BackButton onClick={() => setSwapUiVisible(false)}>{t('swap.back-button')}</BackButton>
                </SectionHeaderWrapper>
            </TabHeader>

            <HeaderWrapper>
                <HeaderItem>
                    <StepHeader>{t('swap.enter-amount')}</StepHeader>
                    <CurrentStep>
                        {t('swap.step')} <strong>{'1'}</strong> {'/2'}
                    </CurrentStep>
                </HeaderItem>
                {fromTokenDisplay && connectedAccount.address ? (
                    <ConnectedWalletWrapper onClick={() => setOpenWallet(true)}>
                        <>
                            {getCurrencyIcon({ symbol: fromTokenDisplay.symbol || 'ETH', width: 20 })}
                            {truncateMiddle((connectedAccount?.address as `0x${string}`) || '', 6)}
                        </>
                    </ConnectedWalletWrapper>
                ) : null}
            </HeaderWrapper>

            <SwapOption>
                <span>{uiDirection === 'toXtm' ? t('swap.sell') : t('swap.receive-estimated')}</span>
                <SwapOptionAmount>
                    <SwapAmountInput
                        type="text"
                        $error={uiDirection === 'toXtm' ? notEnoughBalance : false}
                        inputMode="decimal"
                        placeholder="0.00"
                        onChange={(e) => setFromAmount(e.target.value)}
                        value={ethTokenAmount}
                    />
                    <SwapOptionCurrency $clickable={true} onClick={() => setTokenSelectOpen(true)}>
                        {getCurrencyIcon({ symbol: fromTokenDisplay?.symbol || 'ETH', width: 25 })}
                        <span>{fromTokenDisplay?.symbol || 'ETH'}</span>
                        <ChevronSVG />
                    </SwapOptionCurrency>
                </SwapOptionAmount>
                {connectedAccount.address ? <span>{`${t('swap.balance')}: ${fromTokenDisplay?.balance}`}</span> : null}
            </SwapOption>

            <SwapDirection>
                <SwapDirectionWrapper $direction={uiDirection} onClick={handleToggleUiDirection}>
                    <ArrowIcon width={15} />
                </SwapDirectionWrapper>
            </SwapDirection>

            <SwapOption>
                <span>{uiDirection === 'toXtm' ? t('swap.receive-estimated') : t('swap.sell')}</span>
                <SwapOptionAmount>
                    <SwapAmountInput
                        type="text"
                        $error={uiDirection === 'fromXtm' ? notEnoughBalance : false}
                        inputMode="decimal"
                        placeholder="0.00"
                        onChange={(e) => setTargetAmount(e.target.value)}
                        value={wxtmAmount}
                    />
                    <SwapOptionCurrency>
                        {getCurrencyIcon({ symbol: 'XTM', width: 25 })}
                        <span>{'wXTM'}</span>
                    </SwapOptionCurrency>
                </SwapOptionAmount>
                {connectedAccount.address ? <span>{`${t('swap.balance')}: ${toTokenDisplay?.balance}`}</span> : null}
            </SwapOption>
            {errorMsg && <SwapErrorMessage> {errorMsg} </SwapErrorMessage>}
            <SubmitButtonWrapper>
                <WalletButton variant="primary" onClick={() => setReviewSwap(true)} size="xl" disabled={disabled}>
                    {connectedAccount.address
                        ? isLoading
                            ? t('swap.loading')
                            : t('swap.review-swap')
                        : t('swap.connect-wallet')}
                </WalletButton>
            </SubmitButtonWrapper>

            {/* ////////////////////////////////// */}
            {/* Floating Elements */}

            <ConnectWallet isOpen={reviewSwap && !connectedAccount.address} setIsOpen={setReviewSwap} />

            <SwapConfirmation
                isOpen={Boolean(
                    reviewSwap && connectedAccount.address && !notEnoughBalance && Number(ethTokenAmount) > 0
                )}
                setIsOpen={setReviewSwap}
                onConfirm={handleConfirm}
                transaction={transaction}
                fromTokenDisplay={fromTokenDisplay}
            />

            <ProcessingTransaction
                status={isProcessingSwap ? 'processingswap' : swapSuccess ? 'success' : 'error'}
                isOpen={processingOpen && !isProcessingApproval}
                setIsOpen={setProcessingOpen}
                fees={transaction?.paidTransactionFee}
                txBlockHash={transaction?.txBlockHash}
                transactionId={transaction?.transactionId ?? undefined}
            />

            <TokenSelection
                isOpen={tokenSelectOpen}
                setIsOpen={setTokenSelectOpen}
                availableTokens={selectableFromTokens}
                onSelectToken={handleSelectFromToken}
            />

            <WalletContents isOpen={openWallet} setIsOpen={setOpenWallet} availableTokens={selectableFromTokens} />

            <SignApprovalMessage isOpen={isProcessingApproval} setIsOpen={setProcessingOpen} />
            {/* ////////////////////////////////// */}
        </SwapsContainer>
    );
};

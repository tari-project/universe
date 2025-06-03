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
import { HeaderLabel, TabHeader } from '../../components/Tabs/tab.styles';
import { SwapConfirmation } from '@app/containers/floating/SwapDialogs/sections/SwapConfirmation/SwapConfirmation';
import { ProcessingTransaction } from '@app/containers/floating/SwapDialogs/sections/ProcessingTransaction/ProcessingTransaction';

import { ChevronSVG } from '@app/assets/icons/chevron';
import { useSwapData } from './useSwapData';
import { TokenSelection } from '@app/containers/floating/SwapDialogs/sections/TokenSelection/TokenSelection';
import { truncateMiddle } from '@app/utils';
import { useMemo, useState, useRef, memo } from 'react'; // Added useRef
import { WalletContents } from '@app/containers/floating/SwapDialogs/sections/WalletContents/WalletContents';
import { SignApprovalMessage } from '@app/containers/floating/SwapDialogs/sections/SignMessage/SignApprovalMessage';
import { useTranslation } from 'react-i18next';
import { setIsSwapping } from '@app/store/actions/walletStoreActions';
import { EnabledTokensEnum } from '@app/hooks/swap/lib/constants';
import { useAdaptiveFontSize } from '@app/hooks/helpers/useAdaptiveFontSize';
import { useAppKitWallet } from '@reown/appkit-wallet-button/react';

export const Swap = memo(function Swap() {
    const [openWallet, setOpenWallet] = useState(false);
    const connectedAccount = useAccount();
    const { connect } = useAppKitWallet();
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
        insufficientLiquidity,
        lastUpdatedField,
        setProcessingOpen,
        setFromAmount,
        setTargetAmount,
        setReviewSwap,
        handleToggleUiDirection,
        handleConfirm,
        setTokenSelectOpen,
        handleSelectFromToken,
    } = useSwapData();

    const handleButtonClick = () => {
        if (connectedAccount.address) {
            setReviewSwap(true);
        } else {
            connect('walletConnect');
        }
    };

    const disabled = useMemo(() => {
        const hasAmount = Number(ethTokenAmount) > 0 || Number(wxtmAmount) > 0; // Check if either has a positive amount
        return Boolean(isLoading || !hasAmount || insufficientLiquidity || notEnoughBalance);
    }, [isLoading, notEnoughBalance, insufficientLiquidity, ethTokenAmount, wxtmAmount]);

    // Refs for the input elements
    const fromInputRef = useRef<HTMLInputElement>(null);
    const toInputRef = useRef<HTMLInputElement>(null);

    // Use the hook for each input
    const fromInputFontSize = useAdaptiveFontSize({
        inputValue: ethTokenAmount,
        inputRef: fromInputRef,
    });

    const toInputFontSize = useAdaptiveFontSize({
        inputValue: wxtmAmount,
        inputRef: toInputRef,
    });

    return (
        <SwapsContainer>
            <TabHeader $noBorder>
                <SectionHeaderWrapper>
                    <HeaderLabel>{t('swap.buy-tari')}</HeaderLabel>
                    <BackButton onClick={() => setIsSwapping(false)}>{t('swap.back-button')}</BackButton>
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
                            {getCurrencyIcon({ symbol: EnabledTokensEnum.ETH, width: 20 })}
                            {truncateMiddle((connectedAccount?.address as `0x${string}`) || '', 6)}
                        </>
                    </ConnectedWalletWrapper>
                ) : null}
            </HeaderWrapper>
            <SwapOption $paddingBottom={25}>
                <span>{uiDirection === 'toXtm' ? t('swap.sell') : t('swap.receive-estimated')}</span>
                <SwapOptionAmount>
                    <SwapAmountInput
                        ref={fromInputRef} // Assign ref
                        type="text"
                        $error={uiDirection === 'toXtm' ? notEnoughBalance : false}
                        $loading={isLoading && lastUpdatedField === 'wxtmField'}
                        inputMode="decimal"
                        placeholder="0.00"
                        onChange={(e) => setFromAmount(e.target.value)}
                        value={ethTokenAmount}
                        $dynamicFontSize={fromInputFontSize} // Pass dynamic font size
                    />
                    <SwapOptionCurrency $clickable={true} onClick={() => setTokenSelectOpen(true)}>
                        {getCurrencyIcon({ symbol: fromTokenDisplay?.symbol || EnabledTokensEnum.ETH, width: 25 })}
                        <span>{fromTokenDisplay?.symbol || 'ETH'}</span>
                        <ChevronSVG width={18} />
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
                        ref={toInputRef} // Assign ref
                        type="text"
                        $error={uiDirection === 'fromXtm' ? notEnoughBalance : false}
                        $loading={isLoading && lastUpdatedField === 'ethTokenField'}
                        inputMode="decimal"
                        placeholder="0.00"
                        onChange={(e) => setTargetAmount(e.target.value)}
                        value={wxtmAmount}
                        $dynamicFontSize={toInputFontSize} // Pass dynamic font size
                    />
                    <SwapOptionCurrency>
                        {getCurrencyIcon({ symbol: EnabledTokensEnum.WXTM, width: 25 })}
                        <span>{'wXTM'}</span>
                    </SwapOptionCurrency>
                </SwapOptionAmount>
                {connectedAccount.address ? <span>{`${t('swap.balance')}: ${toTokenDisplay?.balance}`}</span> : null}
            </SwapOption>
            {error && <SwapErrorMessage> {error} </SwapErrorMessage>}
            {/* Show error only if it exists */}
            <SubmitButtonWrapper>
                <WalletButton
                    variant="primary"
                    onClick={handleButtonClick}
                    size="xl"
                    disabled={disabled && !!connectedAccount.address}
                >
                    {connectedAccount.address
                        ? isLoading
                            ? t('swap.loading')
                            : t('swap.review-swap')
                        : t('swap.connect-wallet')}
                </WalletButton>
            </SubmitButtonWrapper>
            {/* ////////////////////////////////// */}
            {/* Floating Elements */}
            <SwapConfirmation
                isOpen={Boolean(
                    reviewSwap &&
                        connectedAccount.address &&
                        !notEnoughBalance &&
                        (Number(ethTokenAmount) > 0 || Number(wxtmAmount) > 0)
                )}
                setIsOpen={setReviewSwap}
                onConfirm={handleConfirm}
                transaction={transaction}
                fromTokenDisplay={fromTokenDisplay}
                toTokenSymbol={toTokenDisplay?.symbol}
            />
            <ProcessingTransaction
                status={
                    isProcessingApproval
                        ? 'processingapproval'
                        : isProcessingSwap
                          ? 'processingswap'
                          : swapSuccess
                            ? 'success'
                            : error // If there's an error, set status to 'error'
                              ? 'error'
                              : 'processingapproval' // Default or handle appropriately
                }
                isOpen={processingOpen && !isProcessingApproval}
                setIsOpen={setProcessingOpen}
                fees={{
                    approval: transaction?.paidTransactionFeeApproval ?? null,
                    swap: transaction?.paidTransactionFeeSwap ?? null,
                }}
                txBlockHash={transaction?.txBlockHash ?? undefined}
                transactionId={transaction?.transactionId ?? undefined}
                errorMessage={error} // Pass the error message
            />
            <TokenSelection
                isOpen={tokenSelectOpen}
                setIsOpen={setTokenSelectOpen}
                availableTokens={selectableFromTokens}
                onSelectToken={handleSelectFromToken}
            />
            <WalletContents isOpen={openWallet} setIsOpen={setOpenWallet} availableTokens={selectableFromTokens} />
            <SignApprovalMessage isOpen={isProcessingApproval && processingOpen} setIsOpen={setProcessingOpen} />
        </SwapsContainer>
    );
});

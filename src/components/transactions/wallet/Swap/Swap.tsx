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
} from './Swap.styles';
import { useAccount } from 'wagmi';
import { getCurrencyIcon } from '@app/containers/floating/WalletConnections/helpers/getIcon';
import { ArrowIcon } from '@app/containers/floating/WalletConnections/icons/elements/ArrowIcon';
import { WalletButton } from '@app/containers/floating/WalletConnections/components/WalletButton/WalletButton';
import { ConnectWallet } from '@app/containers/floating/WalletConnections/sections/ConnectWallet/ConnectWallet';
import { HeaderLabel, TabHeader } from '../../components/Tabs/tab.styles';
import { setWalletUiVisible } from '@app/store/actions/walletStoreActions';
import { SwapConfirmation } from '@app/containers/floating/WalletConnections/sections/SwapConfirmation/SwapConfirmation';
import { ProcessingTransaction } from '@app/containers/floating/WalletConnections/sections/ProcessingTransaction/ProcessingTransaction';

import { Chevron } from '@app/assets/icons/Chevron';
import { useSwapData } from './useSwapData';
import { TokenSelection } from '@app/containers/floating/WalletConnections/sections/TokenSelection/TokenSelection';
import { truncateMiddle } from '@app/utils';
import { useState } from 'react';
import { WalletContents } from '@app/containers/floating/WalletConnections/sections/WalletContents/WalletContents';
import { SignApprovalMessage } from '@app/containers/floating/WalletConnections/sections/SignMessage/SignApprovalMessage';

export const Swap = () => {
    const [openWallet, setOpenWallet] = useState(false);
    const connectedAccount = useAccount();

    const {
        notEnoughBalance,
        fromTokenDisplay,
        toTokenDisplay,
        reviewSwap,
        isLoading,
        procesingOpen,
        isProcessingApproval,
        isProcessingSwap,
        swapSuccess,
        fromAmount,
        targetAmount,
        uiDirection,
        transaction,
        //displayPrice,
        setProcesingOpen,
        setFromAmount,
        setTargetAmount,
        setReviewSwap,
        setUiDirection,
        handleConfirm,
        tokenSelectOpen,
        setTokenSelectOpen,
        handleSelectFromToken,
        selectableFromTokens,
    } = useSwapData();

    return (
        <>
            <TabHeader $noBorder>
                <SectionHeaderWrapper>
                    <HeaderLabel>{'Buy Tari'}</HeaderLabel>
                    <BackButton onClick={() => setWalletUiVisible(false)}>{'Back'}</BackButton>
                </SectionHeaderWrapper>
            </TabHeader>

            <HeaderWrapper>
                <HeaderItem>
                    <StepHeader>{'Enter amount'}</StepHeader>
                    <CurrentStep>
                        {'Step'} <strong>{'1'}</strong> {'/2'}
                    </CurrentStep>
                </HeaderItem>
                {fromTokenDisplay && connectedAccount.address ? (
                    <ConnectedWalletWrapper onClick={() => setOpenWallet(true)}>
                        <>
                            {getCurrencyIcon({ simbol: fromTokenDisplay.symbol.toLowerCase() || 'eth', width: 20 })}
                            {truncateMiddle((connectedAccount?.address as `0x${string}`) || '', 6)}
                        </>
                    </ConnectedWalletWrapper>
                ) : null}
            </HeaderWrapper>

            <SwapOption>
                <span> {'Sell'} </span>
                <SwapOptionAmount>
                    <SwapAmountInput
                        type="text"
                        $error={notEnoughBalance}
                        inputMode="decimal"
                        placeholder="0.00"
                        onChange={(e) => setFromAmount(e.target.value)}
                        value={fromAmount}
                    />
                    <SwapOptionCurrency $clickable={true} onClick={() => setTokenSelectOpen(true)}>
                        {getCurrencyIcon({ simbol: fromTokenDisplay.symbol.toLowerCase() || 'eth', width: 25 })}
                        <span>{fromTokenDisplay.symbol || 'ETH'}</span>
                        <Chevron />
                    </SwapOptionCurrency>
                </SwapOptionAmount>
                <span>{`Balance: ${fromTokenDisplay.balance}`}</span>
            </SwapOption>

            <SwapDirection>
                <SwapDirectionWrapper $direction={uiDirection} onClick={setUiDirection}>
                    <ArrowIcon width={15} />
                </SwapDirectionWrapper>
            </SwapDirection>

            <SwapOption>
                <span> {'Receive (Estimated)'} </span>
                <SwapOptionAmount>
                    <SwapAmountInput
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        onChange={(e) => setTargetAmount(e.target.value)}
                        value={targetAmount}
                    />
                    <SwapOptionCurrency>
                        {getCurrencyIcon({ simbol: 'xtm', width: 25 })}
                        <span>{'wXTM'}</span>
                    </SwapOptionCurrency>
                </SwapOptionAmount>
                <span>{`Balance: ${toTokenDisplay.balance}`}</span>
            </SwapOption>

            <SubmitButtonWrapper>
                <WalletButton
                    variant="primary"
                    onClick={() => setReviewSwap(true)}
                    size="xl"
                    disabled={Boolean(notEnoughBalance || !Number(fromAmount) || isLoading)}
                >
                    {isLoading ? 'Loading...' : 'Review Swap'}
                </WalletButton>
            </SubmitButtonWrapper>

            {/* ////////////////////////////////// */}
            {/* Floating Elements */}

            <ConnectWallet isOpen={reviewSwap && !connectedAccount.address} setIsOpen={setReviewSwap} />

            <SwapConfirmation
                isOpen={Boolean(reviewSwap && connectedAccount.address && !notEnoughBalance && Number(fromAmount) > 0)}
                setIsOpen={setReviewSwap}
                onConfirm={handleConfirm}
                transaction={transaction}
                fromTokenDisplay={fromTokenDisplay}
            />

            <ProcessingTransaction
                status={isProcessingSwap ? 'processingswap' : swapSuccess ? 'success' : 'error'}
                isOpen={procesingOpen && !isProcessingApproval}
                setIsOpen={setProcesingOpen}
            />

            <TokenSelection
                isOpen={tokenSelectOpen}
                setIsOpen={setTokenSelectOpen}
                availableTokens={selectableFromTokens}
                onSelectToken={handleSelectFromToken}
            />

            <WalletContents isOpen={openWallet} setIsOpen={setOpenWallet} />

            <SignApprovalMessage isOpen={isProcessingApproval} setIsOpen={setProcesingOpen} />
            {/* ////////////////////////////////// */}
        </>
    );
};

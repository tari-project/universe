import {
    BackButton,
    ConnectedWalletWrapper,
    CurrentStep,
    HeaderItem,
    HeaderWrapper,
    SectionHeaderWrapper,
    StepHeader,
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
        transaction,
        uiDirection,
        //useSwapError,
        setProcesingOpen,
        setFromAmount,
        setTargetAmount,
        setReviewSwap,
        setUiDirection,
        handleConfirm,
        tokenSelectOpen,
        setTokenSelectOpen,
        handleSelectFromToken, // New
        selectableFromTokens, // New
    } = useSwapData();

    return (
        <>
            <TabHeader $noBorder>
                <SectionHeaderWrapper>
                    <HeaderLabel>{'Buy Tari'}</HeaderLabel> {/* Or dynamic based on 'toTokenDisplay.symbol' */}
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
                <ConnectedWalletWrapper onClick={() => setOpenWallet(true)}>
                    {fromTokenDisplay ? (
                        <>
                            {getCurrencyIcon({ simbol: fromTokenDisplay.symbol.toLowerCase() || 'eth', width: 20 })}
                            {truncateMiddle((connectedAccount?.address as `0x${string}`) || '', 6)}
                        </>
                    ) : null}
                </ConnectedWalletWrapper>
            </HeaderWrapper>

            <SwapOption>
                <span> {'Sell'} </span>
                <SwapOptionAmount>
                    <SwapAmountInput
                        type="text"
                        $error={notEnoughBalance} // notEnoughBalance is now specific to fromAmount and fromTokenDisplay
                        inputMode="decimal"
                        placeholder="0.00"
                        onChange={(e) => setFromAmount(e.target.value)}
                        // onBlur={formatAmounts} // Review if needed
                        value={fromAmount}
                    />
                    <SwapOptionCurrency $clickable={true} onClick={() => setTokenSelectOpen(true)}>
                        {/* Make clickable if you add token selection */}
                        {getCurrencyIcon({ simbol: fromTokenDisplay.symbol.toLowerCase() || 'eth', width: 25 })}
                        <span>{fromTokenDisplay.symbol || 'ETH'}</span>
                        <Chevron /> {/* Icon for dropdown if token is selectable */}
                    </SwapOptionCurrency>
                </SwapOptionAmount>
                {/* Display balance for the "FROM" token */}
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
                        // onBlur={formatAmounts} // Review if needed
                        value={targetAmount}
                    />
                    <SwapOptionCurrency>
                        {getCurrencyIcon({ simbol: 'xtm', width: 25 })}
                        <span>{'wXTM'}</span>
                    </SwapOptionCurrency>
                </SwapOptionAmount>
                <span>{`Balance: ${toTokenDisplay.balance}`}</span>
            </SwapOption>

            <div style={{ marginTop: '20px', width: '100%' }}>
                <WalletButton
                    variant="primary"
                    onClick={() => setReviewSwap(true)}
                    size="xl"
                    disabled={Boolean(notEnoughBalance || !Number(fromAmount) || isLoading)}
                >
                    {isLoading ? 'Loading...' : 'Review Swap'}
                </WalletButton>
            </div>

            <ConnectWallet isOpen={reviewSwap && !connectedAccount.address} setIsOpen={setReviewSwap} />
            <SwapConfirmation
                isOpen={Boolean(reviewSwap && connectedAccount.address && !notEnoughBalance && Number(fromAmount) > 0)}
                setIsOpen={setReviewSwap}
                transaction={transaction} // Pass the assembled transaction object
                onConfirm={handleConfirm}
            />
            <ProcessingTransaction
                // Adjust status based on isProcessingApproval and isProcessingSwap
                status={
                    isProcessingApproval
                        ? 'processingapproval'
                        : isProcessingSwap
                          ? 'processingswap'
                          : swapSuccess
                            ? 'success'
                            : 'error'
                }
                isOpen={procesingOpen}
                setIsOpen={setProcesingOpen}
                //transactionId={transaction.transactionId} // Pass transactionId
            />

            <TokenSelection
                isOpen={tokenSelectOpen}
                setIsOpen={setTokenSelectOpen}
                availableTokens={selectableFromTokens}
                onSelectToken={handleSelectFromToken}
            />

            <WalletContents isOpen={openWallet} setIsOpen={setOpenWallet} />
        </>
    );
};

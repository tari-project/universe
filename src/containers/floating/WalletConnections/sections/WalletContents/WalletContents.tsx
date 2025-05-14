import { WalletAddress } from '../../WalletConnections.style'; // Assuming WalletAddress is styled here
import MMFox from '../../icons/mm-fox';
import { useAccount, useDisconnect } from 'wagmi'; // useBalance might be used per token later
import { WalletButton } from '../../components/WalletButton/WalletButton';
import {
    ActiveDot,
    ConnectedWalletWrapper,
    StatusWrapper,
    WalletContentsContainer,
    TokenList,
    TokenItem,
    TokenItemLeft,
    TokenIconWrapper,
    TokenInfo,
    TokenName,
    TokenSymbol,
    TokenItemRight,
    TokenSeparator,
    ContinueButton,
} from './WalletContents.styles';
import { truncateMiddle } from '@app/utils/truncateString.ts';
import { useCallback } from 'react';
import { getCurrencyIcon } from '../../helpers/getIcon'; // Could be used for token icons
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { AnimatePresence } from 'motion/react'; // Assuming framer-motion
import { SelectableTokenInfo } from '@app/components/transactions/wallet/Swap/useSwapData';

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    availableTokens: SelectableTokenInfo[];
}

export const WalletContents = ({ isOpen, setIsOpen, availableTokens }: Props) => {
    const { disconnect } = useDisconnect();
    const { address: accountAddress } = useAccount();

    const handleDisconnect = useCallback(() => {
        if (accountAddress) {
            disconnect();
        }
        setIsOpen(false);
    }, [accountAddress, disconnect, setIsOpen]);

    const handleContinue = useCallback(() => {
        setIsOpen(false);
    }, [setIsOpen]);

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)} title={'Wallet Connected'}>
            <AnimatePresence mode="wait">
                <WalletContentsContainer>
                    <ConnectedWalletWrapper>
                        <WalletButton variant="error" onClick={handleDisconnect}>
                            {'Disconnect'}
                        </WalletButton>
                        <StatusWrapper>
                            <ActiveDot />
                            <MMFox width="25" />
                            <WalletAddress>{truncateMiddle(accountAddress || '', 5)}</WalletAddress>
                        </StatusWrapper>
                    </ConnectedWalletWrapper>

                    <TokenList>
                        {availableTokens.map((token, index) => (
                            <div key={token.symbol}>
                                {/* Key on the fragment/wrapper if separator is outside TokenItem */}
                                <TokenItem>
                                    <TokenItemLeft>
                                        <TokenIconWrapper>
                                            {getCurrencyIcon({
                                                simbol: token.symbol.toLowerCase() || '',
                                                width: 32,
                                            })}
                                        </TokenIconWrapper>
                                        <TokenInfo>
                                            <TokenName>{token.label}</TokenName>
                                            <TokenSymbol>{token.symbol}</TokenSymbol>
                                        </TokenInfo>
                                    </TokenItemLeft>
                                    <TokenItemRight>
                                        {token.usdValue && <span className="usd">{token.usdValue}</span>}
                                        {token.balance && <span className="balance">{token.balance}</span>}
                                    </TokenItemRight>
                                </TokenItem>
                                {index < availableTokens.length - 1 && <TokenSeparator />}
                            </div>
                        ))}
                    </TokenList>

                    <ContinueButton onClick={handleContinue}>{'Continue'}</ContinueButton>
                </WalletContentsContainer>
            </AnimatePresence>
        </TransactionModal>
    );
};

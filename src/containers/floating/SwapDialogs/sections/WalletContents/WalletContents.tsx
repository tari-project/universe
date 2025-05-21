import MMFox from '../../icons/mm-fox';
import { useAccount, useDisconnect } from 'wagmi';
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
    WalletAddress,
} from './WalletContents.styles';
import { truncateMiddle } from '@app/utils/truncateString.ts';
import { useCallback } from 'react';
import { getCurrencyIcon } from '../../helpers/getIcon';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { AnimatePresence } from 'motion/react';
import { SelectableTokenInfo } from '@app/components/transactions/wallet/Swap/useSwapData';
import { useTranslation } from 'react-i18next';

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    availableTokens: SelectableTokenInfo[];
}

export const WalletContents = ({ isOpen, setIsOpen, availableTokens }: Props) => {
    const { t } = useTranslation(['common', 'wallet'], { useSuspense: false });
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
        <TransactionModal
            show={isOpen}
            handleClose={() => setIsOpen(false)}
            title={t('wallet-connected', { ns: 'wallet' })}
        >
            <AnimatePresence mode="wait">
                <WalletContentsContainer>
                    <ConnectedWalletWrapper>
                        <WalletButton variant="error" onClick={handleDisconnect}>
                            {t('disconnect', { ns: 'common' })}
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
                                <TokenItem>
                                    <TokenItemLeft>
                                        <TokenIconWrapper>
                                            {getCurrencyIcon({
                                                symbol: token.symbol,
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
                                        <span className="balance">{token.balance || `0.000 ${token.symbol}`}</span>
                                    </TokenItemRight>
                                </TokenItem>
                                {index < availableTokens.length - 1 && <TokenSeparator />}
                            </div>
                        ))}
                    </TokenList>

                    <WalletButton onClick={handleContinue} variant="primary" size="large">
                        {t('continue', { ns: 'common' })}
                    </WalletButton>
                </WalletContentsContainer>
            </AnimatePresence>
        </TransactionModal>
    );
};

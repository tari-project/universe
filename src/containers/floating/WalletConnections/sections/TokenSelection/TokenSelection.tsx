import TransactionModal from '@app/components/TransactionModal/TransactionModal'; // Adjust path if needed
import { AnimatePresence } from 'framer-motion';
import { getCurrencyIcon } from '../../helpers/getIcon';
import { ModalContent, TokenDetails, TokenInfo, TokenItem, TokenList, TokenValue } from './TokenSelection.styles';
import { SelectableTokenInfo } from '@app/components/transactions/wallet/Swap/useSwapData';

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    availableTokens: SelectableTokenInfo[];
    onSelectToken: (token: SelectableTokenInfo) => void; // Changed from setActiveToken
}

export const TokenSelection = ({ isOpen, setIsOpen, availableTokens, onSelectToken }: Props) => {
    const handleSelectToken = (token: SelectableTokenInfo) => {
        onSelectToken(token);
        setIsOpen(false);
    };

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)} title={'Select a token'}>
            <AnimatePresence mode="wait">
                {isOpen && (
                    <ModalContent
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <TokenList>
                            {availableTokens.map((token) =>
                                token.symbol.toLowerCase() === 'wxtm' ? null : (
                                    <TokenItem
                                        key={token.symbol + (token.address || 'native')}
                                        onClick={() => handleSelectToken(token)}
                                    >
                                        <TokenInfo>
                                            {getCurrencyIcon({ simbol: token.symbol.toLowerCase() || '', width: 32 })}{' '}
                                            {/* Increased icon size */}
                                            <TokenDetails>
                                                <span className="name">{token.label}</span>
                                                <span className="symbol">{token.symbol}</span>
                                            </TokenDetails>
                                        </TokenInfo>
                                        <TokenValue>
                                            {token.usdValue && <span className="usd">{token.usdValue}</span>}
                                            {token.balance && <span className="balance">{token.balance}</span>}
                                        </TokenValue>
                                    </TokenItem>
                                )
                            )}
                            {availableTokens.length === 0 && (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#a0a0b0' }}>
                                    {'No other tokens available to select.'}
                                </div>
                            )}
                        </TokenList>
                    </ModalContent>
                )}
            </AnimatePresence>
        </TransactionModal>
    );
};

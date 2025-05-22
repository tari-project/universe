import TransactionModal from '@app/components/TransactionModal/TransactionModal'; // Adjust path if needed
import { AnimatePresence } from 'motion/react';
import { getCurrencyIcon } from '../../helpers/getIcon';
import { ModalContent, TokenDetails, TokenInfo, TokenItem, TokenList, TokenValue } from './TokenSelection.styles';
import { SelectableTokenInfo } from '@app/components/transactions/wallet/Swap/useSwapData';
import { useTranslation } from 'react-i18next';

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    availableTokens: SelectableTokenInfo[];
    onSelectToken: (token: SelectableTokenInfo) => void;
}

export const TokenSelection = ({ isOpen, setIsOpen, availableTokens, onSelectToken }: Props) => {
    const { t } = useTranslation(['wallet'], { useSuspense: false });
    const handleSelectToken = (token: SelectableTokenInfo) => {
        onSelectToken(token);
        setIsOpen(false);
    };

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)} title={t('swap.select-token')}>
            <AnimatePresence mode="wait">
                {isOpen && (
                    <ModalContent
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <TokenList role="listbox" aria-label={t('swap.select-token')}>
                            {availableTokens.map((token) =>
                                token.symbol.toLowerCase() === 'wxtm' ? null : (
                                    <TokenItem
                                        key={token.symbol + (token.address || 'native')}
                                        onClick={() => handleSelectToken(token)}
                                        role="option"
                                        tabIndex={0}
                                        aria-selected="false"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                handleSelectToken(token);
                                            }
                                        }}
                                    >
                                        <TokenInfo>
                                            {getCurrencyIcon({ symbol: token.symbol, width: 32 })}
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
                                    {t('swap.no-other-tokens-available')}
                                </div>
                            )}
                        </TokenList>
                    </ModalContent>
                )}
            </AnimatePresence>
        </TransactionModal>
    );
};

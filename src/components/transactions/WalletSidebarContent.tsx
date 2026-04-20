import { Receive } from './receive/Receive';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import SendModal from '@app/components/transactions/send/SendModal.tsx';
import Wallet from '../wallet/sidebarWallet/wallet.tsx';
import { useWalletStore } from '@app/store';
import { TransactionDetails } from '@app/components/transactions/history/transactionDetails/TransactionDetails.tsx';
import { setSelectedTransactionId } from '@app/store/actions/walletStoreActions.ts';
import { AnimatePresence } from 'motion/react';
import SwapUI from '@app/components/wallet/sidebarWallet/swap.tsx';

export default function WalletSidebarContent() {
    const { t } = useTranslation('wallet');
    const selectedTransaction = useWalletStore((s) => s.selectedTransaction());
    const isSwapping = useWalletStore((s) => s.is_swapping);
    const [section, setSection] = useState('history');
    return (
        <>
            <AnimatePresence mode="wait">
                {isSwapping ? <SwapUI /> : <Wallet section={section} setSection={setSection} />}
            </AnimatePresence>

            {section !== 'history' && <SendModal section={section} setSection={setSection} />}
            <TransactionModal
                show={section === 'receive'}
                title={`${t('tabs.receive')}  ${t('tari')}`}
                handleClose={() => setSection('history')}
            >
                <Receive />
            </TransactionModal>
            {selectedTransaction ? (
                <TransactionDetails
                    transaction={selectedTransaction}
                    expanded={Boolean(selectedTransaction)}
                    handleClose={() => setSelectedTransactionId(null)}
                />
            ) : null}
        </>
    );
}

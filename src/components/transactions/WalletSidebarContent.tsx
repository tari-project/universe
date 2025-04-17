import { Send } from './send/Send';
import { Receive } from './receive/Receive';
import Wallet from './wallet/Wallet';
import { WalletGreyBox, WalletSections } from './WalletSidebarContent.styles.ts';
import { memo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import TransactionModal from './components/TransactionModal/TransactionModal.tsx';

const WalletSidebarContent = memo(function WalletSidebarContent() {
    const [section, setSection] = useState('history');
    return (
        <>
            <WalletSections>
                <WalletGreyBox>
                    <Wallet section={section} setSection={setSection} />
                </WalletGreyBox>
            </WalletSections>

            <AnimatePresence>
                {section === 'send' && (
                    <TransactionModal handleClose={() => setSection('history')}>
                        <Send section={section} setSection={setSection} />
                    </TransactionModal>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {section === 'receive' && (
                    <TransactionModal handleClose={() => setSection('history')}>
                        <Receive section={section} setSection={setSection} />
                    </TransactionModal>
                )}
            </AnimatePresence>
        </>
    );
});

export default WalletSidebarContent;

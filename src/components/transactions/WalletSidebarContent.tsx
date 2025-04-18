import { Send } from './send/Send';
import { Receive } from './receive/Receive';
import Wallet from './wallet/Wallet';
import { WalletGreyBox, WalletSections } from './WalletSidebarContent.styles.ts';
import { memo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import TransactionModal from './components/TransactionModal/TransactionModal.tsx';
import { useTranslation } from 'react-i18next';

const WalletSidebarContent = memo(function WalletSidebarContent() {
    const { t } = useTranslation('wallet');
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
                    <TransactionModal
                        title={`${t('tabs.send')}  ${t('tari')}`}
                        handleClose={() => setSection('history')}
                    >
                        <Send section={section} setSection={setSection} />
                    </TransactionModal>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {section === 'receive' && (
                    <TransactionModal
                        title={`${t('tabs.receive')}  ${t('tari')}`}
                        handleClose={() => setSection('history')}
                    >
                        <Receive />
                    </TransactionModal>
                )}
            </AnimatePresence>
        </>
    );
});

export default WalletSidebarContent;

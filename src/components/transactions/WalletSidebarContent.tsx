import { Send } from './send/Send';
import { Receive } from './receive/Receive';
import Wallet from './wallet/Wallet';
import { WalletGreyBox, WalletSections } from './WalletSidebarContent.styles.ts';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';

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

            <TransactionModal
                show={section === 'send'}
                title={`${t('tabs.send')}  ${t('tari')}`}
                handleClose={() => setSection('history')}
            >
                <Send section={section} setSection={setSection} />
            </TransactionModal>

            <TransactionModal
                show={section === 'receive'}
                title={`${t('tabs.receive')}  ${t('tari')}`}
                handleClose={() => setSection('history')}
            >
                <Receive />
            </TransactionModal>
        </>
    );
});

export default WalletSidebarContent;

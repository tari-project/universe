import { Receive } from './receive/Receive';
import Wallet from './wallet/Wallet';
import { WalletGreyBox, WalletSections } from './WalletSidebarContent.styles.ts';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import SendModal from '@app/components/transactions/send/SendModal.tsx';
import { useWalletStore } from '@app/store/useWalletStore.ts';

const WalletSidebarContent = memo(function WalletSidebarContent() {
    const { t } = useTranslation('wallet');
    const [section, setSection] = useState('history');
    const isSwapping = useWalletStore((s) => s.is_swapping);
    return (
        <>
            <WalletSections>
                <WalletGreyBox $absolute={isSwapping}>
                    <Wallet section={section} setSection={setSection} />
                </WalletGreyBox>
            </WalletSections>

            <SendModal section={section} setSection={setSection} />

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

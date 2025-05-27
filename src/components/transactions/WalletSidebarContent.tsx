import { Receive } from './receive/Receive';
import Wallet from './wallet/Wallet';
import { WalletGreyBox, WalletSections } from './WalletSidebarContent.styles.ts';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import SendModal from '@app/components/transactions/send/SendModal.tsx';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';

const WalletSidebarContent = memo(function WalletSidebarContent() {
    const { t } = useTranslation('wallet');
    const [section, setSection] = useState('history');
    const swapUiEnabled = useAirdropStore((s) => s.swapsEnabled);
    return (
        <>
            <WalletSections>
                <WalletGreyBox $absolute={swapUiEnabled}>
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

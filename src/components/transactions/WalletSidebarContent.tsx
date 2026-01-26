import { Receive } from './receive/Receive';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import SendModal from '@app/components/transactions/send/SendModal.tsx';
import SidebarWallet from '@app/components/wallet/sidebarWallet/SidebarWallet.tsx';

export default function WalletSidebarContent() {
    const { t } = useTranslation('wallet');
    const [section, setSection] = useState('history');
    return (
        <>
            <SidebarWallet section={section} setSection={setSection} />

            {section !== 'history' && <SendModal section={section} setSection={setSection} />}

            <TransactionModal
                show={section === 'receive'}
                title={`${t('tabs.receive')}  ${t('tari')}`}
                handleClose={() => setSection('history')}
            >
                <Receive />
            </TransactionModal>
        </>
    );
}

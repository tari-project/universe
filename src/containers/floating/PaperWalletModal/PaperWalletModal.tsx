import GreenModal from '@app/components/GreenModal/GreenModal';
import { memo, useState } from 'react';
import ConnectSection from './sections/ConnectSection/ConnectSection';
import QRCodeSection from './sections/QRCodeSection/QRCodeSection';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore';

export type PaperWalletModalSectionType = 'Connect' | 'QRCode';

const PaperWalletModal = memo(function PaperWalletModal() {
    const showModal = usePaperWalletStore((s) => s.showModal);
    const setShowModal = usePaperWalletStore((s) => s.setShowModal);

    const [section, setSection] = useState<PaperWalletModalSectionType>('Connect');

    const handleClose = () => {
        setSection('Connect');
        setShowModal(false);
    };

    return (
        <GreenModal onClose={handleClose} showModal={showModal}>
            {section === 'Connect' && <ConnectSection setSection={setSection} />}
            {section === 'QRCode' && <QRCodeSection onDoneClick={handleClose} />}
        </GreenModal>
    );
});

export default PaperWalletModal;

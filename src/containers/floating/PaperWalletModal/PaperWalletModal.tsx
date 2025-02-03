import GreenModal from '@app/components/GreenModal/GreenModal';
import { AnimatePresence, useMotionValue } from 'motion/react';
import { useEffect, useState } from 'react';
import ConnectSection from './sections/ConnectSection/ConnectSection';
import QRCodeSection from './sections/QRCodeSection/QRCodeSection';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore';

export type PaperWalletModalSectionType = 'Connect' | 'QRCode';

export default function PaperWalletModal() {
    const showModal = usePaperWalletStore((s) => s.showModal);
    const setShowModal = usePaperWalletStore((s) => s.setShowModal);

    const [section, setSection] = useState<PaperWalletModalSectionType>('Connect');
    const boxWidth = useMotionValue(618);

    const handleClose = () => {
        setSection('Connect');
        setShowModal(false);
    };

    useEffect(() => {
        if (section == 'QRCode') {
            boxWidth.set(780);
        } else {
            boxWidth.set(682);
        }
    }, [boxWidth, section]);

    return (
        <AnimatePresence>
            {showModal && (
                <GreenModal onClose={handleClose} boxWidth={boxWidth.get()}>
                    {section === 'Connect' && <ConnectSection setSection={setSection} />}
                    {section === 'QRCode' && <QRCodeSection onDoneClick={handleClose} />}
                </GreenModal>
            )}
        </AnimatePresence>
    );
}

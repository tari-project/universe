import GreenModal from '@app/components/GreenModal/GreenModal';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import ConnectSection from './sections/ConnectSection/ConnectSection';
import QRCodeSection from './sections/QRCodeSection/QRCodeSection';

export type PaperWalletModalSectionType = 'Connect' | 'QRCode';

export default function PaperWalletModal() {
    const [showModal, setShowModal] = useState(true);
    const [section, setSection] = useState<PaperWalletModalSectionType>('Connect');
    const [boxWidth, setBoxWidth] = useState(618);

    const handleClose = () => {
        setShowModal(false);
    };

    useEffect(() => {
        if (section == 'QRCode') {
            setBoxWidth(725);
        } else {
            setBoxWidth(682);
        }
    }, [section]);

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                style={{
                    pointerEvents: 'all',
                }}
            >
                Open Modal
            </button>
            <AnimatePresence>
                {showModal && (
                    <GreenModal onClose={handleClose} boxWidth={boxWidth}>
                        {section === 'Connect' && <ConnectSection setSection={setSection} />}
                        {section === 'QRCode' && <QRCodeSection />}
                    </GreenModal>
                )}
            </AnimatePresence>
        </>
    );
}

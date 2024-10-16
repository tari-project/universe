import GreenModal from '@app/components/GreenModal/GreenModal';
import lockImage from './images/locked-image.png';
import { LockImage } from './styles';
import { AnimatePresence } from 'framer-motion';
import ProtectIntro from './sections/ProtectIntro/ProtectIntro';
import { useEffect, useState } from 'react';
import SeedPhrase from './sections/SeedPhrase/SeedPhrase';
import VerifySeedPhrase from './sections/VerifySeedPhrase/VerifySeedPhrase';

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export type StagedSecuritySectionType = 'ProtectIntro' | 'SeedPhrase' | 'VerifySeedPhrase';

export default function StagedSecurityModal({ open, setOpen }: Props) {
    const [boxWidth, setBoxWidth] = useState(618);
    const [section, setSection] = useState<StagedSecuritySectionType>('ProtectIntro');

    const handleClose = () => {
        setOpen(false);
        setSection('ProtectIntro');
    };

    useEffect(() => {
        if (section == 'SeedPhrase' || section == 'VerifySeedPhrase') {
            setBoxWidth(710);
        } else {
            setBoxWidth(618);
        }
    }, [section]);

    return (
        <AnimatePresence>
            {open && (
                <GreenModal onClose={handleClose} boxWidth={boxWidth}>
                    <LockImage src={lockImage} alt="Lock Icon" />

                    {section == 'ProtectIntro' && <ProtectIntro setSection={setSection} />}
                    {section == 'SeedPhrase' && <SeedPhrase setSection={setSection} />}
                    {section == 'VerifySeedPhrase' && <VerifySeedPhrase setSection={setSection} setOpen={setOpen} />}
                </GreenModal>
            )}
        </AnimatePresence>
    );
}

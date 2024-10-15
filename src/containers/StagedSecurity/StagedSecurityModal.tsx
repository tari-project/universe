import GreenModal from '@app/components/GreenModal/GreenModal';
import lockImage from './images/locked-image.png';
import { LockImage } from './styles';
import { AnimatePresence } from 'framer-motion';
import ProtectIntro from './sections/ProtectIntro/ProtectIntro';
import { useState } from 'react';
import SeedPhrase from './sections/SeedPhrase/SeedPhrase';
import VerifySeedPhrase from './sections/VerifySeedPhrase/VerifySeedPhrase';

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export type StagedSecuritySectionType = 'ProtectIntro' | 'SeedPhrase' | 'VerifySeedPhrase';

export default function StagedSecurityModal({ open, setOpen }: Props) {
    const [section, setSection] = useState<StagedSecuritySectionType>('ProtectIntro');

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <AnimatePresence>
            {open && (
                <GreenModal onClose={handleClose}>
                    <LockImage src={lockImage} alt="Lock Icon" />

                    {section == 'ProtectIntro' && <ProtectIntro setSection={setSection} />}
                    {section == 'SeedPhrase' && <SeedPhrase setSection={setSection} />}
                    {section == 'VerifySeedPhrase' && <VerifySeedPhrase setSection={setSection} />}
                </GreenModal>
            )}
        </AnimatePresence>
    );
}

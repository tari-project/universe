import GreenModal from '@app/components/GreenModal/GreenModal';
import lockImage from './images/locked-image.png';
import { LockImage } from './styles';
import { AnimatePresence, useMotionValue } from 'motion/react';
import ProtectIntro from './sections/ProtectIntro/ProtectIntro';
import { useCallback, useEffect, useState } from 'react';
import SeedPhrase from './sections/SeedPhrase/SeedPhrase';
import VerifySeedPhrase from './sections/VerifySeedPhrase/VerifySeedPhrase';
import { useStagedSecurityStore } from '@app/store/useStagedSecurityStore';
import { useGetSeedWords } from '../Settings/sections/wallet/SeedWordsMarkup/useGetSeedWords';
import HelpTip from './components/HelpTip/HelpTip';
import { useTranslation } from 'react-i18next';

export type StagedSecuritySectionType = 'ProtectIntro' | 'SeedPhrase' | 'VerifySeedPhrase';

export default function StagedSecurity() {
    const { t } = useTranslation(['staged-security'], { useSuspense: false });

    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords();

    const showModal = useStagedSecurityStore((s) => s.showModal);
    const setShowModal = useStagedSecurityStore((s) => s.setShowModal);
    const showReminderTip = useStagedSecurityStore((s) => s.showReminderTip);
    const setShowReminderTip = useStagedSecurityStore((s) => s.setShowReminderTip);
    const showCompletedTip = useStagedSecurityStore((s) => s.showCompletedTip);
    const setShowCompletedTip = useStagedSecurityStore((s) => s.setShowCompletedTip);

    const boxWidth = useMotionValue(618);
    const [section, setSection] = useState<StagedSecuritySectionType>('ProtectIntro');

    const handleBackupButtonClick = useCallback(async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }
    }, [seedWordsFetched, getSeedWords]);

    useEffect(() => {
        if (section === 'ProtectIntro' && seedWords.length > 0) {
            setSection('SeedPhrase');
        }
    }, [seedWords, section]);

    const handleClose = () => {
        setShowModal(false);
        setSection('ProtectIntro');
        setShowReminderTip(true);
    };

    const handleSection = useCallback((section: StagedSecuritySectionType) => {
        setSection(section);
    }, []);

    useEffect(() => {
        if (section == 'SeedPhrase' || section == 'VerifySeedPhrase') {
            boxWidth.set(710);
        } else {
            boxWidth.set(618);
        }
    }, [boxWidth, section]);

    const seedPhraseSection =
        section == 'SeedPhrase' ? <SeedPhrase setSection={handleSection} words={seedWords} /> : null;

    return (
        <>
            <AnimatePresence>
                {showModal && (
                    <GreenModal onClose={handleClose} boxWidth={boxWidth.get()}>
                        <LockImage src={lockImage} alt="Lock Icon" />

                        {section == 'ProtectIntro' ? (
                            <ProtectIntro onButtonClick={handleBackupButtonClick} isLoading={seedWordsFetching} />
                        ) : null}
                        {seedPhraseSection}
                        {section == 'VerifySeedPhrase' && (
                            <VerifySeedPhrase setSection={handleSection} words={seedWords} />
                        )}
                    </GreenModal>
                )}
            </AnimatePresence>

            {!showCompletedTip && (
                <HelpTip
                    title={t('reminderTip.title')}
                    text={t('reminderTip.text')}
                    show={showReminderTip}
                    setShow={setShowReminderTip}
                />
            )}

            <HelpTip
                title={t('completedTip.title')}
                text={t('completedTip.text')}
                show={showCompletedTip}
                setShow={setShowCompletedTip}
            />
        </>
    );
}

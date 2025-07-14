import { useStagedSecurityStore } from '@app/store';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    Wrapper,
    ButtonWrapper,
    PhraseWrapper,
    WordsSelected,
    Placeholder,
    WordPill,
    WordButtons,
    WordButton,
} from './styles.ts';
import { AnimatePresence } from 'motion/react';
import PillCloseIcon from '@app/assets/icons/PillCloseIcon.tsx';
import { CTA } from '@app/components/security/styles.ts';

interface VerifySeedPhraseProps {
    words: string[];
}

interface SelectedWord {
    index: number;
    word: string;
}

export function VerifySeedPhrase({ words }: VerifySeedPhraseProps) {
    const { t } = useTranslation(['staged-security'], { useSuspense: false });
    const setShowModal = useStagedSecurityStore((s) => s.setShowModal);
    const setModalStep = useStagedSecurityStore((s) => s.setModalStep);
    const setShowCompletedTip = useStagedSecurityStore((s) => s.setShowCompletedTip);

    const [completed, setCompleted] = useState(false);
    const [selectedWords, setSelectedWords] = useState<SelectedWord[]>([]);

    const shuffledWords = useMemo(() => [...words].sort(() => Math.random() - 0.5), [words]);

    const checkCompletion = (selectedWords: string[]) => {
        if (selectedWords.length === words.length) {
            for (let i = 0; i < words.length; i++) {
                if (selectedWords[i] !== words[i]) {
                    setCompleted(false);
                    return;
                }
            }
            setCompleted(true);
        } else {
            setCompleted(false);
        }
    };

    const addWord = (index: number, word: string) => {
        if (!selectedWords.some((w) => w.index === index)) {
            const newSelectedWords = [...selectedWords, { index, word }];
            setSelectedWords(newSelectedWords);
            checkCompletion(newSelectedWords.map((w) => w.word));
        }
    };

    const removeWord = (index: number) => {
        const newSelectedWords = selectedWords.filter((w) => w.index !== index);
        setSelectedWords(newSelectedWords);
        checkCompletion(newSelectedWords.map((w) => w.word));
    };

    const handleSubmit = () => {
        setShowModal(false);
        setModalStep('ProtectIntro');
        setShowCompletedTip(true);
    };

    return (
        <Wrapper>
            <PhraseWrapper>
                <WordsSelected>
                    <AnimatePresence>
                        {selectedWords.length === 0 && (
                            <Placeholder
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {t('verifySeed.placeholder')}
                            </Placeholder>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="popLayout">
                        {selectedWords.map((data) => (
                            <WordPill
                                key={'VerifySeedPhrase' + data.word + data.index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                onClick={() => removeWord(data.index)}
                            >
                                {data.word}
                                <PillCloseIcon />
                            </WordPill>
                        ))}
                    </AnimatePresence>
                </WordsSelected>

                <WordButtons>
                    {shuffledWords.map((word, index) => (
                        <WordButton
                            key={index}
                            onClick={() => addWord(index, word)}
                            disabled={selectedWords.some((w) => w.index === index && w.word === word)}
                        >
                            {word}
                        </WordButton>
                    ))}
                </WordButtons>
            </PhraseWrapper>

            <ButtonWrapper>
                <CTA size="xlarge" onClick={handleSubmit} disabled={!completed}>
                    <span>{t('verifySeed.button')}</span>
                </CTA>
            </ButtonWrapper>
        </Wrapper>
    );
}

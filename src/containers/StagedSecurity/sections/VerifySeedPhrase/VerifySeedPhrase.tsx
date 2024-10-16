import { useMemo, useState } from 'react';
import { StagedSecuritySectionType } from '../../StagedSecurityModal';
import { BlackButton, Text, Title } from '../../styles';
import {
    ButtonWrapper,
    PhraseWrapper,
    Placeholder,
    TextWrapper,
    WordButton,
    WordButtons,
    WordPill,
    WordsSelected,
    Wrapper,
} from './styles';
import { AnimatePresence } from 'framer-motion';
import PillCloseIcon from '../../icons/PillCloseIcon';
import { seedWordsTEMP } from '../SeedPhrase/SeedPhrase';
import { useTranslation } from 'react-i18next';

interface Props {
    setSection: (section: StagedSecuritySectionType) => void;
    setOpen: (open: boolean) => void;
}

export default function VerifySeedPhrase({ setSection, setOpen }: Props) {
    const { t } = useTranslation(['staged-security'], { useSuspense: false });

    const [completed, setCompleted] = useState(false);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);

    const words = seedWordsTEMP;

    const shuffledWords = useMemo(() => [...words].sort(() => Math.random() - 0.5), []);

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

    const addWord = (word: string) => {
        const newSelectedWords = [...selectedWords, word];
        setSelectedWords(newSelectedWords);
        checkCompletion(newSelectedWords);
    };

    const removeWord = (word: string) => {
        const newSelectedWords = selectedWords.filter((w) => w !== word);
        setSelectedWords(newSelectedWords);
        checkCompletion(newSelectedWords);
    };

    const handleSubmit = () => {
        setOpen(false);
        setSection('ProtectIntro');
    };

    return (
        <Wrapper>
            <TextWrapper>
                <Title>{t('verifySeed.title')}</Title>
                <Text>{t('verifySeed.text')}</Text>
            </TextWrapper>

            <PhraseWrapper>
                <WordsSelected layout>
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
                        {selectedWords.map((word) => (
                            <WordPill
                                key={word}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                onClick={() => removeWord(word)}
                            >
                                {word}
                                <PillCloseIcon />
                            </WordPill>
                        ))}
                    </AnimatePresence>
                </WordsSelected>

                <WordButtons>
                    {shuffledWords.map((word, index) => (
                        <WordButton key={index} onClick={() => addWord(word)} disabled={selectedWords.includes(word)}>
                            {word}
                        </WordButton>
                    ))}
                </WordButtons>
            </PhraseWrapper>

            <ButtonWrapper>
                <BlackButton onClick={handleSubmit} disabled={!completed}>
                    <span>{t('verifySeed.button')}</span>
                </BlackButton>
            </ButtonWrapper>
        </Wrapper>
    );
}

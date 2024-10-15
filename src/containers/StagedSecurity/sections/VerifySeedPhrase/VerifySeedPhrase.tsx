import { useState } from 'react';
import { StagedSecuritySectionType } from '../../StagedSecurityModal';
import { BlackButton, Text, Title } from '../../styles';
import {
    ButtonWrapper,
    PhraseWrapper,
    TextWrapper,
    WordButton,
    WordButtons,
    WordPill,
    WordsSelected,
    Wrapper,
} from './styles';
import { AnimatePresence } from 'framer-motion';
import PillCloseIcon from '../../icons/PillCloseIcon';

const words: string[] = [
    'Mother',
    'Dog',
    'Shaker',
    'Drag',
    'Shoe',
    'Snow',
    'Bee',
    'Thirst',
    'Draw',
    'Snake',
    'Pickle',
    'Smear',
    'Crane',
    'Trunk',
    'Salt',
    'Drain',
    'Clap',
    'Smack',
    'Rust',
    'Red',
    'Juice',
    'Lemon',
    'Drink',
    'Well',
];

interface Props {
    setSection: (section: StagedSecuritySectionType) => void;
}

export default function VerifySeedPhrase({ setSection }: Props) {
    const [completed, setCompleted] = useState(false);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);

    const toggleSelectedWord = (word: string) => {
        if (selectedWords.includes(word)) {
            setSelectedWords(selectedWords.filter((w) => w !== word));
        } else {
            setSelectedWords([...selectedWords, word]);
        }
    };

    return (
        <Wrapper>
            <TextWrapper>
                <Title>Verify your seed phrase</Title>
                <Text>Select the words in the correct order.</Text>
            </TextWrapper>

            <PhraseWrapper>
                <WordsSelected>
                    <AnimatePresence mode="popLayout">
                        {selectedWords.map((word) => (
                            <WordPill
                                key={word}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                onClick={() => toggleSelectedWord(word)}
                            >
                                {word}
                                <PillCloseIcon />
                            </WordPill>
                        ))}
                    </AnimatePresence>
                </WordsSelected>

                <WordButtons>
                    {words.map((word, index) => (
                        <WordButton
                            key={index}
                            onClick={() => toggleSelectedWord(word)}
                            $selected={selectedWords.includes(word)}
                        >
                            {word}
                        </WordButton>
                    ))}
                </WordButtons>
            </PhraseWrapper>

            <ButtonWrapper>
                <BlackButton onClick={() => setSection('VerifySeedPhrase')} disabled={!completed}>
                    <span>Complete Verification</span>
                </BlackButton>
            </ButtonWrapper>
        </Wrapper>
    );
}

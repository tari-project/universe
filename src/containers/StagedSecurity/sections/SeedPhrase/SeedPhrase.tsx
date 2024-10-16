import { useState } from 'react';
import { StagedSecuritySectionType } from '../../StagedSecurityModal';
import { BlackButton, Text, Title } from '../../styles';
import {
    ButtonWrapper,
    Check,
    Checkbox,
    CheckboxText,
    CheckboxWrapper,
    CopyButton,
    Divider,
    PhraseWrapper,
    TextWrapper,
    Word,
    WordColumn,
    WordList,
    Wrapper,
} from './styles';
import CopyIcon from '../../icons/CopyIcon';
import CheckIcon from '../../icons/CheckIcon';
import { AnimatePresence } from 'framer-motion';

export const seedWordsTEMP: string[] = [
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

export default function SeedPhrase({ setSection }: Props) {
    const [copied, setCopied] = useState(false);
    const [checked, setChecked] = useState(false);

    const words = seedWordsTEMP;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(words.join(' ')).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleCheckboxClick = () => {
        setChecked(!checked);
    };

    const wordGroups: string[][] = [];

    for (let i = 0; i < words.length; i += 6) {
        wordGroups.push(words.slice(i, i + 6));
    }

    return (
        <Wrapper>
            <TextWrapper>
                <Title>Write down your seed phrase and store it somewhere safe</Title>
                <Text>You will need this code again to restore your wallet.</Text>
            </TextWrapper>

            <PhraseWrapper>
                <WordList>
                    {wordGroups.map((group, groupIndex) => (
                        <>
                            <WordColumn key={groupIndex}>
                                {group.map((word, index) => (
                                    <Word key={index}>
                                        <span>{groupIndex * 6 + index + 1}.</span>
                                        {word}
                                    </Word>
                                ))}
                            </WordColumn>
                            {groupIndex < 3 && <Divider />}
                        </>
                    ))}
                </WordList>

                <CopyButton onClick={copyToClipboard}>
                    {copied ? (
                        'Copied!'
                    ) : (
                        <>
                            Copy to clipboard <CopyIcon />
                        </>
                    )}
                </CopyButton>
            </PhraseWrapper>

            <ButtonWrapper>
                <CheckboxWrapper onClick={handleCheckboxClick}>
                    <Checkbox $checked={checked}>
                        <AnimatePresence>
                            {checked && (
                                <Check
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                >
                                    <CheckIcon />
                                </Check>
                            )}
                        </AnimatePresence>
                    </Checkbox>
                    <CheckboxText>
                        I understand that if I lose my recovery seed phrase I will not be able to restore my wallet.
                    </CheckboxText>
                </CheckboxWrapper>

                <BlackButton onClick={() => setSection('VerifySeedPhrase')} disabled={!checked}>
                    <span>VERIFY SEED PHRASE</span>
                </BlackButton>
            </ButtonWrapper>
        </Wrapper>
    );
}

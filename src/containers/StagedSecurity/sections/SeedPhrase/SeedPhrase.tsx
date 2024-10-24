import { useState } from 'react';
import { StagedSecuritySectionType } from '../../StagedSecurity';
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
import { useTranslation } from 'react-i18next';
interface Props {
    setSection: (section: StagedSecuritySectionType) => void;
    words: string[];
}

export default function SeedPhrase({ setSection, words }: Props) {
    const { t } = useTranslation(['staged-security'], { useSuspense: false });

    const [copied, setCopied] = useState(false);
    const [checked, setChecked] = useState(false);

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
                <Title>{t('seedPhrase.title')}</Title>
                <Text>{t('seedPhrase.text')}</Text>
            </TextWrapper>

            <PhraseWrapper>
                <WordList>
                    {wordGroups.map((group, groupIndex) => (
                        <>
                            <WordColumn key={groupIndex}>
                                {group.map((word, index) => (
                                    <Word key={'SeedPhrase' + word}>
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
                        t('seedPhrase.copied')
                    ) : (
                        <>
                            {t('seedPhrase.copy')} <CopyIcon />
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
                    <CheckboxText>{t('seedPhrase.checkbox')}</CheckboxText>
                </CheckboxWrapper>

                <BlackButton onClick={() => setSection('VerifySeedPhrase')} disabled={!checked}>
                    <span>{t('seedPhrase.button')}</span>
                </BlackButton>
            </ButtonWrapper>
        </Wrapper>
    );
}

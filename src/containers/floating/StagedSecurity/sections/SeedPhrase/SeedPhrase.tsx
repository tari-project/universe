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
    GroupCol,
    GroupDivider,
    PhraseWrapper,
    TextWrapper,
    Word,
    WordColumn,
    WordList,
    Wrapper,
} from './styles';
import CopyIcon from '../../icons/CopyIcon';
import CheckIcon from '../../icons/CheckIcon';
import { AnimatePresence } from 'motion';
import { useTranslation } from 'react-i18next';
import { useCopyToClipboard } from '@app/hooks';

interface Props {
    setSection: (section: StagedSecuritySectionType) => void;
    words: string[];
}

const seedWordGroups = (words: string[]) => {
    const groups: string[][] = [];
    for (let i = 0; i < words.length; i += 6) {
        groups.push(words.slice(i, i + 6));
    }
    return groups;
};

const SeedPhrase = ({ setSection, words }: Props) => {
    const { t } = useTranslation('staged-security');
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    const [checked, setChecked] = useState(false);

    const handleCopy = () => {
        copyToClipboard(words.join(' '));
    };

    const handleCheckboxClick = () => {
        setChecked(!checked);
    };

    return (
        <Wrapper>
            <TextWrapper>
                <Title>{t('seedPhrase.title')}</Title>
                <Text>{t('seedPhrase.text')}</Text>
            </TextWrapper>

            <PhraseWrapper>
                <WordList>
                    {seedWordGroups(words).map((group, groupIndex) => (
                        <GroupCol key={groupIndex}>
                            <WordColumn key={groupIndex}>
                                {group.map((word, index) => (
                                    <Word key={'SeedPhrase' + word}>
                                        <span>{groupIndex * 6 + index + 1}.</span>
                                        {word}
                                    </Word>
                                ))}
                            </WordColumn>
                            {groupIndex < 3 && <GroupDivider />}
                        </GroupCol>
                    ))}
                </WordList>

                <CopyButton onClick={handleCopy}>
                    {isCopied ? (
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
};

export default SeedPhrase;

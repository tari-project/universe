import {
    Wrapper,
    ButtonWrapper,
    Check,
    Checkbox,
    CheckboxText,
    CheckboxWrapper,
    CopyButton,
    GroupCol,
    GroupDivider,
    PhraseWrapper,
    Word,
    WordColumn,
    WordList,
} from './styles.ts';
import { useTranslation } from 'react-i18next';
import { useCopyToClipboard } from '@app/hooks';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useStagedSecurityStore } from '@app/store';
import CheckIcon from '@app/assets/icons/CheckIcon.tsx';
import CopyIcon from '@app/assets/icons/CopyIcon.tsx';
import { CTA } from '@app/components/security/styles.ts';

interface ViewSeedPhraseProps {
    words: string[];
}

const seedWordGroups = (words: string[]) => {
    const groups: string[][] = [];
    for (let i = 0; i < words.length; i += 6) {
        groups.push(words.slice(i, i + 6));
    }
    return groups;
};

export function ViewSeedPhrase({ words }: ViewSeedPhraseProps) {
    const { t } = useTranslation('staged-security');
    const { isCopied, copyToClipboard } = useCopyToClipboard();

    const setModalStep = useStagedSecurityStore((s) => s.setModalStep);
    const [checked, setChecked] = useState(false);

    function handleCopy() {
        copyToClipboard(words.join(' '));
    }

    function handleCheckboxClick() {
        setChecked((c) => !c);
    }

    return (
        <Wrapper>
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

                <CTA size="xlarge" onClick={() => setModalStep('VerifySeedPhrase')} disabled={!checked}>
                    <span>{t('seedPhrase.button')}</span>
                </CTA>
            </ButtonWrapper>
        </Wrapper>
    );
}

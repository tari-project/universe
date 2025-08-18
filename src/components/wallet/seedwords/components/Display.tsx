import { memo } from 'react';
import { AddSeedWordsWrapper, CTAWrapper, DisplayWrapper, HiddenWrapper, WordsWrapper } from './display.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';

interface DisplayProps {
    words: string[];
    isVisible: boolean;
    isLoading?: boolean;
    onToggleClick?: (currentVisibilty?: boolean) => void;
    isSeedlessUI?: boolean;
}
const Display = memo(function Display({ isVisible, words, onToggleClick, isLoading, isSeedlessUI }: DisplayProps) {
    function handleToggleClick() {
        onToggleClick?.(isVisible);
    }

    const wordAmount = words?.length || 0;
    const rowCount = isVisible && !isLoading ? (wordAmount % 5 === 0 ? 5 : 6) : 1;

    const wordMarkup = words?.map((word, i) => {
        const count = i + 1;
        return (
            <WordsWrapper key={`seed-word-${count}-${word}`}>
                <Typography key={`seed-no-${i}`} variant="p" style={{ minWidth: 15 }}>
                    {count}.
                </Typography>
                <Typography variant="p" key={word}>
                    {word}
                </Typography>
            </WordsWrapper>
        );
    });

    const hiddenMarkup = (
        <HiddenWrapper>
            <Typography>****************************************************</Typography>
        </HiddenWrapper>
    );

    const emptySeedWords = (
        <AddSeedWordsWrapper>
            <Typography variant="p">{`Add seedwords to restore another Tari Address`}</Typography>
        </AddSeedWordsWrapper>
    );

    const toggleIcon = isVisible ? <IoEyeOffOutline /> : <IoEyeOutline />;

    const toggleCTA = (
        <CTAWrapper>
            <IconButton onClick={() => handleToggleClick()} disabled={isLoading}>
                {isLoading ? <LoadingDots /> : toggleIcon}
            </IconButton>
        </CTAWrapper>
    );

    const generatedDisplay = isVisible && !isLoading ? wordMarkup : hiddenMarkup;

    return (
        <DisplayWrapper $rows={rowCount} $isHidden={!isVisible || isLoading}>
            {!isSeedlessUI && toggleCTA}
            {isSeedlessUI ? emptySeedWords : generatedDisplay}
        </DisplayWrapper>
    );
});

export default Display;

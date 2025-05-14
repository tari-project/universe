import { memo, useState } from 'react';
import { CTAWrapper, DisplayWrapper, HiddenWrapper, WordsWrapper } from './display.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';

interface DisplayProps {
    words: string[];
}
const Display = memo(function Display({ words }: DisplayProps) {
    const [isVisible, setIsVisible] = useState(false);

    const wordAmount = words?.length || 0;
    const rowCount = isVisible ? (wordAmount % 5 === 0 ? 5 : 6) : 1;

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

    const toggleCTA = (
        <CTAWrapper>
            <IconButton onClick={() => setIsVisible((c) => !c)}>
                {isVisible ? <IoEyeOffOutline /> : <IoEyeOutline />}
            </IconButton>
        </CTAWrapper>
    );

    return (
        <DisplayWrapper $rows={rowCount} $isHidden={!isVisible}>
            {toggleCTA}
            {isVisible ? wordMarkup : hiddenMarkup}
        </DisplayWrapper>
    );
});

export default Display;

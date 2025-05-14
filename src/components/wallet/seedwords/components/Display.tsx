import { memo } from 'react';
import { DisplayWrapper, WordsWrapper } from './display.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';

interface DisplayProps {
    words: string[];
}
const Display = memo(function Display({ words }: DisplayProps) {
    const wordMarkup = words?.map((word, i) => {
        const count = i + 1;
        return (
            <WordsWrapper key={`seed-word-${count}-${word}`} direction="row" justifyContent="flex-start">
                <Typography key={`seed-no-${i}`} variant="p" style={{ minWidth: 15 }}>
                    {count}.
                </Typography>
                <Typography variant="p" key={word}>
                    {word}
                </Typography>
            </WordsWrapper>
        );
    });

    const wordAmount = words?.length || 0;
    const rowCount = wordAmount % 5 === 0 ? 5 : 6;

    return <DisplayWrapper $rows={rowCount}>{wordMarkup}</DisplayWrapper>;
});

export default Display;

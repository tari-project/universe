import { Wrapper, SeedWordsContainer, HiddenContainer } from './SeedWords.styles.ts';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

interface SeedWordsProps {
    seedWords?: string[];
    showSeedWords?: boolean;
}

export const SeedWords = ({ seedWords, showSeedWords = false }: SeedWordsProps) => {
    const wordMarkup = seedWords?.map((word, i) => {
        const count = i + 1;

        return (
            <Stack key={`seed-word-${word}`} direction="row" justifyContent="flex-start">
                <Typography key={`seed-no-${i}`} variant="p" style={{ minWidth: 15 }}>
                    {count}.
                </Typography>
                <Typography variant="p" key={word}>
                    {word}
                </Typography>
            </Stack>
        );
    });

    const hiddenMarkup = (
        <HiddenContainer>
            <Typography>****************************************************</Typography>
        </HiddenContainer>
    );

    const visibleMarkup = <SeedWordsContainer>{wordMarkup}</SeedWordsContainer>;
    return <Wrapper>{showSeedWords ? visibleMarkup : hiddenMarkup}</Wrapper>;
};

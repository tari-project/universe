import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import styled from 'styled-components';

export interface SeedWordsProps {
    showSeedWords: boolean;
    seedWords: string[];
}

export const SeedWordsContainer = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(12, 1fr);
    gap: 10px;
`;

export const SeedWords = ({ showSeedWords, seedWords }: SeedWordsProps) => {
    return (
        <Stack direction="column" justifyContent="space-between">
            <Typography variant="p">
                {showSeedWords ? (
                    <SeedWordsContainer>
                        {seedWords.map((word, index) => (
                            <Stack key={word} direction="row" justifyContent="flex-start" alignItems="center">
                                <Typography key={index} style={{ color: '#000' }} variant="h6">
                                    {index + 1}.
                                </Typography>
                                <Typography variant="p" key={word}>
                                    {word}
                                </Typography>
                            </Stack>
                        ))}
                    </SeedWordsContainer>
                ) : (
                    '****************************************************'
                )}
            </Typography>
        </Stack>
    );
};

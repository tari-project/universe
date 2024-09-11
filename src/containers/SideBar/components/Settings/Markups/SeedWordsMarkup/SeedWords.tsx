import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import styled from 'styled-components';

import { IconButton } from '@app/components/elements/Button.tsx';
import { IoCopyOutline, IoCheckmarkOutline } from 'react-icons/io5';
import { useState, useCallback } from 'react';
import { useGetSeedWords } from './useGetSeedWords';

export interface SeedWordsProps {
    showSeedWords: boolean;
    seedWords: string[];
}

export const SeedWordsContainer = styled.div`
    position: relative;
    display: grid;
    grid-template-rows: repeat(6, 1fr);
    grid-auto-flow: column;
    gap: 15px;
    background-color: ${({ theme }) => theme.palette.background.default};
    width: 100%;
    border-radius: 10px;
    padding: 20px;
`;

export const CopyIconContainer = styled.div`
    position: absolute;
    top: 10px;
    right: 10px;
`;

export const SeedWords = ({ showSeedWords, seedWords }: SeedWordsProps) => {
    const [isCopyTooltipHidden, setIsCopyTooltipHidden] = useState(true);
    const { getSeedWords, seedWordsFetched } = useGetSeedWords();

    const copySeedWords = useCallback(async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }
        setIsCopyTooltipHidden(false);
        await navigator.clipboard.writeText(seedWords.join(' '));
        setTimeout(() => setIsCopyTooltipHidden(true), 1000);
    }, [seedWords, seedWordsFetched, getSeedWords]);

    return (
        <>
            {showSeedWords ? (
                <SeedWordsContainer>
                    {seedWords.map((word, index) => (
                        <Stack key={word} direction="row" justifyContent="flex-start">
                            <Typography key={index} variant="p" style={{ minWidth: 15 }}>
                                {index + 1}.
                            </Typography>
                            <Typography variant="p" key={word}>
                                {word}
                            </Typography>
                        </Stack>
                    ))}
                    <CopyIconContainer>
                        <IconButton onClick={copySeedWords}>
                            {isCopyTooltipHidden ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                        </IconButton>
                    </CopyIconContainer>
                </SeedWordsContainer>
            ) : (
                <Typography variant="p">****************************************************</Typography>
            )}
        </>
    );
};

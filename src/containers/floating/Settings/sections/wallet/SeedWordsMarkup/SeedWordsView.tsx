import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import styled from 'styled-components';

import { IoCopyOutline, IoCheckmarkOutline, IoPencil } from 'react-icons/io5';
import { useCallback } from 'react';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

export interface SeedWordsProps {
    showSeedWords: boolean;
    seedWords: string[];
    toggleEdit: () => Promise<void>;
    getSeedWords: () => Promise<void>;
    seedWordsFetched: boolean;
}

export const Wrapper = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
`;
export const HiddenContainer = styled.div`
    background-color: ${({ theme }) => theme.palette.background.default};
    width: 100%;
    border-radius: 10px;
    align-items: center;
    height: 40px;
    border: 1px solid ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    display: flex;
    padding: 6px 10px 0;
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 18px;
    font-weight: 500;
`;
export const SeedWordsContainer = styled.div`
    position: relative;
    display: grid;
    grid-template-rows: repeat(6, 1fr);
    grid-auto-flow: column;
    gap: 15px;
    background-color: ${({ theme }) => theme.palette.background.default};
    width: 100%;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    padding: 20px;
`;

export const CopyIconContainer = styled.div`
    color: ${({ theme }) => theme.palette.text.primary};
`;

export const SeedWordsView = ({
    showSeedWords,
    seedWords,
    getSeedWords,
    seedWordsFetched,
    toggleEdit,
}: SeedWordsProps) => {
    const { copyToClipboard, isCopied } = useCopyToClipboard();

    const copySeedWords = useCallback(async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }
        copyToClipboard(seedWords.join(' '));
    }, [copyToClipboard, getSeedWords, seedWords, seedWordsFetched]);

    return (
        <Wrapper>
            {showSeedWords ? (
                <>
                    <SeedWordsContainer>
                        {seedWords.map((word, index) => (
                            <Stack key={`seed-word-${word}`} direction="row" justifyContent="flex-start">
                                <Typography key={`seed-no-${index}`} variant="p" style={{ minWidth: 15 }}>
                                    {index + 1}.
                                </Typography>
                                <Typography variant="p" key={word}>
                                    {word}
                                </Typography>
                            </Stack>
                        ))}
                    </SeedWordsContainer>
                    <CopyIconContainer>
                        <IconButton onClick={copySeedWords}>
                            {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                        </IconButton>
                        <IconButton onClick={toggleEdit}>
                            <IoPencil />
                        </IconButton>
                    </CopyIconContainer>
                </>
            ) : (
                <>
                    <HiddenContainer>
                        <Typography>****************************************************</Typography>
                    </HiddenContainer>
                    <CopyIconContainer>
                        <IconButton onClick={toggleEdit}>
                            <IoPencil />
                        </IconButton>
                    </CopyIconContainer>
                </>
            )}
        </Wrapper>
    );
};

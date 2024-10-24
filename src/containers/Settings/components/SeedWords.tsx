import { Wrapper, SeedWordsContainer, HiddenContainer, IconContainer } from './SeedWords.styles.ts';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { IoCheckmarkOutline, IoCopyOutline, IoPencil } from 'react-icons/io5';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

interface SeedWordsProps {
    seedWords?: string[];
    showSeedWords?: boolean;
    editable?: boolean;
    onToggleEdit?: () => void;
}

export const SeedWords = ({ seedWords, onToggleEdit, showSeedWords = false, editable = false }: SeedWordsProps) => {
    const { copyToClipboard, isCopied } = useCopyToClipboard();
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

    const editCTAMarkup = editable ? (
        <IconButton onClick={onToggleEdit}>
            <IoPencil />
        </IconButton>
    ) : null;

    const copyCTAMarkup = seedWords ? (
        <IconButton onClick={() => copyToClipboard(seedWords.join(' '))}>
            {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
        </IconButton>
    ) : null;

    const hiddenMarkup = (
        <>
            <HiddenContainer>
                <Typography>****************************************************</Typography>
            </HiddenContainer>
            {editCTAMarkup}
        </>
    );

    const wordAmount = seedWords?.length || 0;
    const rowCount = wordAmount % 5 === 0 ? 5 : 6;

    const visibleMarkup = (
        <>
            <SeedWordsContainer $rows={rowCount}>{wordMarkup}</SeedWordsContainer>
            <IconContainer>
                {copyCTAMarkup}
                {editCTAMarkup}
            </IconContainer>
        </>
    );
    return <Wrapper>{showSeedWords ? visibleMarkup : hiddenMarkup}</Wrapper>;
};

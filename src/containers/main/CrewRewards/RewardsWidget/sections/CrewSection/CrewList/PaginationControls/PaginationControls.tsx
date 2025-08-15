import { IconButton } from '@app/components/elements/buttons/IconButton';
import { Typography } from '@app/components/elements/Typography';
import { PaginationWrapper, PageInfo, ButtonGroup, ItemsInfo, LeftChevron, RightChevron } from './styles';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    onNextPage: () => void;
    onPrevPage: () => void;
}

export default function PaginationControls({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    hasNextPage,
    hasPrevPage,
    onNextPage,
    onPrevPage,
}: PaginationControlsProps) {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <PaginationWrapper>
            <ItemsInfo>
                <Typography variant="p" fontSize="12px">
                    {`Showing ${startItem}-${endItem} of ${totalItems} members`}
                </Typography>
            </ItemsInfo>

            <ButtonGroup>
                <IconButton onClick={onPrevPage} disabled={!hasPrevPage} size="small" aria-label="Previous page">
                    <LeftChevron width={16} height={16} />
                </IconButton>

                <PageInfo>
                    <Typography variant="p" fontSize="12px">
                        {`Page ${currentPage} of ${totalPages}`}
                    </Typography>
                </PageInfo>

                <IconButton onClick={onNextPage} disabled={!hasNextPage} size="small" aria-label="Next page">
                    <RightChevron width={16} height={16} />
                </IconButton>
            </ButtonGroup>
        </PaginationWrapper>
    );
}

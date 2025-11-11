import styled from 'styled-components';
import { ChevronSVG } from '@app/assets/icons/chevron';

export const PaginationWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    margin-top: 16px;
    border-top: 1px solid ${({ theme }) => theme.palette.divider};
`;

export const ItemsInfo = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const ButtonGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const PageInfo = styled.div`
    display: flex;
    align-items: center;
    min-width: 80px;
    justify-content: center;
    color: ${({ theme }) => theme.palette.text.primary};
`;

export const LeftChevron = styled(ChevronSVG)`
    transform: rotate(90deg);
`;

export const RightChevron = styled(ChevronSVG)`
    transform: rotate(-90deg);
`;

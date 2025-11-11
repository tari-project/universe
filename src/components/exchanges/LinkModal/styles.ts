import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 480px;
`;
export const LinkButton = styled.button`
    transition: transform 0.2s ease;
    &:hover {
        transform: scale(1.05);
    }
`;
export const CloseButton = styled.button`
    display: flex;
    width: 30px;
    height: 30px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    transition: transform 0.2s ease;
    &:hover {
        transform: scale(1.05);
    }
`;
export const CloseWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
`;

export const HeaderWrapper = styled.div`
    display: flex;
    gap: 5px;
    flex-direction: column;
    padding: 0 15px 15px;
`;

export const InfoWrapper = styled.div`
    display: flex;
    gap: 14px;
    align-items: center;
    font-weight: 600;
`;

export const Title = styled(Typography).attrs({ variant: 'h3' })`
    font-size: 21px;
`;
export const Subtitle = styled(Typography).attrs({ variant: 'p' })`
    font-size: 13px;
`;

export const OptionWrapper = styled.div`
    cursor: pointer;
    display: flex;
    border-radius: 10px;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    background-color: ${({ theme }) => theme.palette.background.paper};
    padding: 15px;
    transition: opacity 0.2s ease;
    &:hover {
        background-color: ${({ theme }) => theme.palette.background.main};
    }
`;

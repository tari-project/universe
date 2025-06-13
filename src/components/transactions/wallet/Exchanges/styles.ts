import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

export const XCWrapper = styled.div``;
export const SectionDivider = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin: 5px 0 10px;
    position: relative;
    p {
        color: ${({ theme }) => theme.colors.greyscale[theme.mode === 'dark' ? 100 : 500]};
        font-weight: 500;
        font-size: 13px;
        opacity: 0.5;
    }
    &:before,
    &:after {
        content: '';
        position: absolute;
        height: 1px;
        width: 122px;
        background-color: ${({ theme }) => theme.colors.greyscale[theme.mode === 'dark' ? 100 : 500]};
        opacity: 0.1;
    }

    &:before {
        left: 0;
    }
    &:after {
        right: 0;
    }
`;

export const XCButton = styled.button`
    display: flex;
    border-radius: 10px;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    background-color: ${({ theme }) => theme.palette.background.splash};
    padding: 10px;
    transition: background-color 0.2s ease-in-out;
    &:hover {
        background-color: ${({ theme }) => convertHexToRGBA(theme.palette.background.main, 0.5)};
    }
`;

export const CopyWrapper = styled.div`
    display: flex;
    gap: 2px;
    flex-direction: column;
`;

export const Title = styled(Typography).attrs({ variant: 'h3' })`
    font-size: 12px;
`;
export const Subtitle = styled(Typography)`
    font-size: 10px;
    font-weight: 500;
`;

export const ChevronCTA = styled.div`
    transform: rotate(-90deg);
    display: flex;
`;

import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

export const DetailsLeft = styled.div`
    display: flex;
    gap: 5px;
`;

export const Name = styled(Typography).attrs({
    variant: 'h6',
})`
    display: flex;
    color: ${({ theme }) => theme.colors.greyscale[100]};
    font-size: 12px;
    font-weight: 500;
    letter-spacing: -0.36px;
`;
export const LogoWrapper = styled.div`
    display: flex;
    width: 20px;
    height: 20px;
    background-color: #000;
    border-radius: 50%;
    color: #c2ff28;
    align-items: center;
    justify-content: center;
    svg,
    img {
        height: 11px;
        display: flex;
    }
`;
export const Actions = styled.div`
    display: flex;
`;

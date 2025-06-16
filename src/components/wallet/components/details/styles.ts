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
    overflow: hidden;
    svg,
    img {
        display: flex;
        max-width: 100%;
    }
`;
export const Actions = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
`;

export const MiningHereWrapper = styled.div`
    border-radius: 85px;
    border: 1px solid #dddddd0d;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(154px);
    padding: 9px 10px 9px 10px;
`;

import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    flex-direction: column;
    display: flex;
    gap: 10px;

    @media (max-height: 680px) {
        gap: 4px;
    }
`;

export const ActionImgWrapper = styled.div`
    align-items: center;
    justify-content: center;
    flex-direction: column;
    svg,
    img {
        max-width: 100%;
        display: flex;
    }
`;

export const GemImgLarge = styled.img`
    width: 30px;
    transform: scaleX(-1);
`;

export const TooltipAction = styled.div`
    color: ${({ theme }) => theme.palette.warning.main};
    display: flex;
    padding-top: 4px;

    button {
        &:hover {
            text-decoration: underline;
        }
    }
`;

export const TooltipHeader = styled(Typography).attrs({ variant: 'h6' })`
    line-height: 0.8;
`;
export const RewardTooltipContent = styled.div`
    display: flex;
    gap: 8px;
    flex-direction: column;
    align-items: flex-start;
`;

export const RewardTooltipItems = styled.div`
    display: flex;
    flex-direction: column;
    color: ${({ theme }) => theme.palette.text.accent};
    align-items: flex-start;
    gap: 8px;
`;

export const RewardTooltipItem = styled(Typography).attrs({ variant: 'p' })`
    color: ${({ theme }) => theme.palette.text.accent};
    font-size: 12px;
    font-weight: 500;
    line-height: 1.2;

    strong {
        font-weight: 700;
    }
`;

export const NextRewardWrapper = styled.div`
    display: flex;
    width: 100%;
    padding: 8px 10px;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    align-self: stretch;
    border-radius: 10px;
    background-color: ${({ theme }) => theme.palette.background.accent};
    h5 {
        color: ${({ theme }) => theme.palette.text.primary};
        line-height: 1;
    }
`;

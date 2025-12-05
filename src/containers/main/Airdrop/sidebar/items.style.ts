import styled from 'styled-components';

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

export const RewardTooltipContent = styled.div`
    display: flex;
    gap: 6px;
    flex-direction: column;
    align-items: flex-start;
`;

export const RewardTooltipItems = styled.div`
    display: flex;
    flex-direction: column;
    color: ${({ theme }) => theme.palette.text.accent};
    align-items: flex-start;
    gap: 2px;
`;

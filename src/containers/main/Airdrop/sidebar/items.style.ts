import styled from 'styled-components';

export const Wrapper = styled.div`
    flex-direction: column;
    display: flex;
    gap: 15px;

    @media (max-height: 680px) {
        gap: 8px;
    }
`;

export const ActionImgWrapper = styled.div`
    align-items: center;
    justify-content: center;
    flex-direction: column;
    img {
        max-width: 100%;
        display: flex;
    }
`;
export const GemImg = styled.img`
    width: 18px;
`;

export const GemImgLarge = styled.img`
    width: 30px;
    transform: scaleX(-1);
`;

export const Avatar = styled.div`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
`;

export const CopyButton = styled.button`
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${({ theme }) => theme.palette.contrast};
    color: ${({ theme }) => theme.palette.contrast};
    svg {
        height: 24px;
    }
    path {
        fill: ${({ theme }) => theme.palette.base};
    }

    &:hover {
        opacity: 0.9;
    }
`;

export const TooltipAction = styled.div`
    color: ${({ theme }) => theme.palette.warning.main};
    display: flex;
    padding-top: 4px;
`;
export const TooltipWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
`;

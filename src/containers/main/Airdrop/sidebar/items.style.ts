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
    flex-direction: column;
    img {
        max-width: 100%;
    }
`;
export const GemImg = styled.img`
    width: 16px;
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
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${({ theme }) => theme.palette.contrast};
    color: ${({ theme }) => theme.palette.contrast};
    svg {
        width: 26px;
    }
    path {
        fill: ${({ theme }) => theme.palette.base};
    }

    &:hover {
        opacity: 0.9;
    }
`;

export const TooltipWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    gap: 6px;
    p {
        font-weight: 500;
    }
`;

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
    circle {
        fill: ${({ theme }) => theme.palette.contrast};
    }
    path {
        fill: ${({ theme }) => theme.palette.base};
    }

    &:hover {
        opacity: 0.9;
    }
`;

export const TooltipWrapper = styled.div`
    min-width: 140px;
    align-items: center;
`;

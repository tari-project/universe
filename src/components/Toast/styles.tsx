import { m } from 'framer-motion';
import { styled } from 'styled-components';

export const ToastsWrapper = styled.div`
    position: fixed;
    left: 0;
    bottom: 0;
    z-index: 202;

    width: 100%;
    pointer-events: none;
    padding: 0 20px;
`;

export const ToastsPadding = styled.div`
    position: relative;

    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    width: 100%;
`;

export const ToastInside = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    user-select: none;
`;

export const ToastWrapper = styled(m.div)`
    background: linear-gradient(274.85deg, #221f3e 36.63%, #342945 89.13%);
    border-radius: 100px;

    width: 100%;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    overflow: hidden;

    position: relative;
    z-index: 1;

    padding: 10px 24px;

    @media (max-width: 768px) {
        padding: 8px 20px;
    }
`;

export const ToastText = styled.div`
    font-weight: 700;
    font-size: 14px;
    line-height: 16px;
    letter-spacing: -0.02em;
    color: #ffffff;
    position: relative;
    z-index: 0;
    max-width: 100%;

    span {
        cursor: pointer;
        text-decoration: underline;
    }

    @media (max-width: 768px) {
        font-size: 12px;
    }
`;

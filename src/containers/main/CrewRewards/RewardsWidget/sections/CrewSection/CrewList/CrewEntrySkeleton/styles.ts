import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
`;

export const Wrapper = styled.div`
    display: flex;
    align-items: center;
    align-self: stretch;
    gap: 14px;

    height: 70px;
    padding: 12px;

    border-radius: 15px;
    border: 1px solid rgba(227, 227, 227, 0.03);
    background: rgba(255, 255, 255, 0.04);

    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.04) 50%, transparent 100%);
        background-size: 200% 200%;
        animation: ${shimmer} 1.5s ease-in-out infinite;
    }
`;

export const Avatar = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
    flex-shrink: 0;
`;

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
`;

export const TopRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 80px;
    gap: 20px;
`;

export const BottomRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
`;

export const TextBar = styled.div`
    width: 100%;

    height: 16px;
    border-radius: 100px;
    background: rgba(255, 255, 255, 0.04);
`;

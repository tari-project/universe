import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

export const ClaimButton = styled('button')<{ $hasError?: boolean }>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;

    height: 50px;
    padding: 12px 14px 12px 20px;

    border-radius: 60px;
    background: #000;
    color: #fff;
    transition: transform 0.2s ease;
    overflow: hidden;
    cursor: pointer;

    &:hover {
        transform: scale(1.05);
    }

    &:disabled {
        pointer-events: none;
    }

    ${({ $hasError }) =>
        $hasError &&
        `
        border-color: var(--color-error, #ff5252);
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        
        @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
        }
    `}
`;

export const Image = styled('img')`
    width: 15px;
`;

export const Title = styled('div')`
    color: #fff;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
`;

export const GemPill = styled('div')`
    display: flex;
    height: 27px;
    padding: 8px 10px 8px 16px;
    justify-content: center;
    align-items: center;
    gap: 2px;

    border-radius: 100px;
    background: ${({ theme }) => theme.colors.brightGreen[500]};
    color: #000;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
`;

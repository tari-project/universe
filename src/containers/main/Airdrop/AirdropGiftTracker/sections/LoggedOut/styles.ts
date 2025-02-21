import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

export const ClaimButton = styled('button')`
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

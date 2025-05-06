import styled from 'styled-components';

export const LockImage = styled('img')`
    position: absolute;
    top: -117px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
`;

export const Title = styled('div')`
    color: ${({ theme }) => theme.palette.text.primary};
    text-align: center;
    font-size: 30.8px;
    font-weight: 600;
    line-height: 99.7%;

    max-width: 463px;
`;

export const Text = styled('div')`
    color: rgba(0, 0, 0, 0.75);
    text-align: center;
    font-size: 16px;
    font-weight: 400;
    line-height: 122%;

    max-width: 500px;
`;

export const BlackButton = styled('button')`
    color: #c9eb00;
    text-align: center;
    font-size: 21px;
    line-height: 99.7%;
    text-transform: uppercase;
    font-family: DrukWide, sans-serif;
    font-weight: 800;

    border-radius: 49px;
    background: #000;
    box-shadow: 28px 28px 77px 0px rgba(0, 0, 0, 0.1);

    width: 100%;
    height: 81px;

    transition: opacity 0.2s ease;
    cursor: pointer;

    span {
        display: block;
        transition: transform 0.2s ease;
    }

    svg {
        width: 48px;
    }

    &:hover {
        span {
            transform: scale(1.05);
        }
    }

    &:disabled {
        opacity: 0.5;
        pointer-events: none;
    }
`;

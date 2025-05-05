import styled from 'styled-components';

export const LockImage = styled('img')`
    position: absolute;
    top: -130px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    max-width: 100%;
    width: 190px;

    @media (max-height: 900px) {
        width: 110px;
        top: -70px;
    }
`;

export const Title = styled('div')`
    color: ${({ theme }) => theme.palette.text.primary};
    text-align: center;
    font-size: min(calc(1rem + 1.1vmin), 30px);
    font-weight: 600;
    line-height: 0.9;
    max-width: 470px;
`;

export const Text = styled('div')`
    color: rgba(0, 0, 0, 0.75);
    text-align: center;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.05;
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
    box-shadow: 28px 28px 77px 0 rgba(0, 0, 0, 0.1);

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

    @media (max-height: 900px) {
        height: 56px;
    }
`;

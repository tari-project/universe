import styled from 'styled-components';

export const Wrapper = styled('div')``;

export const BlackButton = styled('button')`
    color: #c9eb00;
    text-align: center;
    font-size: 21px;
    font-weight: 800;
    line-height: 99.7%;
    text-transform: uppercase;
    font-family: DrukWide, sans-serif;
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

export const TextButton = styled('button')`
    color: rgba(0, 0, 0, 0.75);
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    line-height: 122%;

    &:hover {
        text-decoration: underline;
    }
`;

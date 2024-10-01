import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

export const ClaimButton = styled('button')`
    height: 40px;
    padding: 12px 35px;

    border-radius: 60px;
    background: #000;

    color: #fff;
    text-align: center;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;

    cursor: pointer;
    white-space: nowrap;

    span {
        display: block;
        transition: transform 0.2s ease;
    }

    &:hover {
        span {
            transform: scale(1.075);
        }
    }
`;

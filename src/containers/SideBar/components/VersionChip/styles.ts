import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4px;

    height: 21px;
    padding: 0 10px 0 8px;

    border-radius: 20px;
    background: #000;

    color: #fff;
    font-size: 11px;
    font-weight: 600;
    line-height: 100%;
    white-space: nowrap;

    transform: translateY(1px);

    span {
        color: #afafaf;
    }
`;

export const Divider = styled('div')`
    width: 1px;
    height: 12px;

    background: rgba(255, 255, 255, 0.2);
`;

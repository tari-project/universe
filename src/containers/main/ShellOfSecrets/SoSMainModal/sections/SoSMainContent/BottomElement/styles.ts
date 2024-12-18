import styled from 'styled-components';

export const Wrapper = styled('div')`
    width: 100%;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;

    border-top: 2px solid #e6ff47;

    padding: 5px 10px 0 8px;
    margin-top: 4px;

    &::before {
        content: '';
        position: absolute;
        width: 2px;
        height: 12px;
        background-color: #e6ff47;
        left: 0;
        top: -2px;
    }

    &::after {
        content: '';
        position: absolute;
        width: 2px;
        height: 12px;
        background-color: #e6ff47;
        right: 0;
        top: -2px;
    }
`;

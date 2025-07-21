import styled from 'styled-components';

export const Wrapper = styled.button`
    width: 21px;
    height: 21px;

    opacity: 0.5;
    color: #fff;

    cursor: pointer;
    transition: opacity 0.2s ease-in-out;

    &:hover {
        opacity: 1;
    }
`;

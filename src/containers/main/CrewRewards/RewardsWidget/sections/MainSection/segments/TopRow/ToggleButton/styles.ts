import styled, { css } from 'styled-components';

export const Wrapper = styled.button<{ $isOpen: boolean }>`
    width: 21px;
    height: 21px;

    opacity: 0.5;
    color: #fff;

    cursor: pointer;
    transition:
        opacity 0.2s ease-in-out,
        transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        opacity: 1;
    }

    ${({ $isOpen }) =>
        $isOpen &&
        css`
            transform: scaleY(-1);
        `}
`;

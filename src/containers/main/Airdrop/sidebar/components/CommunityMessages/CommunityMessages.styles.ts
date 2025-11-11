import { MessageType } from '@app/store';
import styled, { css } from 'styled-components';
import * as motion from 'motion/react-m';

export const Message = styled(motion.div)<{ $type: MessageType; $isSidebarOpen: boolean }>`
    position: fixed;
    z-index: 10;
    bottom: 20px;
    right: 30px;
    left: ${({ $isSidebarOpen }) => ($isSidebarOpen ? '490px' : '120px')};

    text-wrap: balance;
    text-align: center;

    display: flex;
    justify-content: center;
    color: black;
    gap: 5px;
    min-height: 40px;
    height: fit-content;
    border-radius: 32px;
    border-width: 2px;
    border-style: solid;
    padding: 10px 20px 10px 15px;

    transition: width 0.3s ease-in-out;

    ${({ $type }) => {
        switch ($type) {
            case 'warning':
                return css`
                    background: #fff1ec;
                    border-color: #ffcc7a;
                `;
            case 'error':
                return css`
                    background: #f9a391;
                    border-color: #ff5733;
                `;
            case 'info':
            default:
                return css`
                    background: white;
                    border-color: black;
                `;
        }
    }};

    padding-inline: 16px;
    align-items: center;

    a {
        color: black;
        font-weight: bold;
        text-decoration: underline;
    }
`;

export const CloseButton = styled.button`
    cursor: pointer;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 10px;

    padding: 1px;
    background: black;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: all;
    border: none;
    outline: none;

    &:focus-visible {
        outline: 2px solid blue;
        outline-offset: 2px;
    }

    svg {
        width: 16px;
        height: 16px;
        color: white;
    }
`;

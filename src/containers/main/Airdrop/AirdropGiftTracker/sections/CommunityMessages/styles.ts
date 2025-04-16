import { MessageType } from '@app/store';
import styled, { css } from 'styled-components';
import * as motion from 'motion/react-m';

export const Message = styled(motion.div)<{ $type: MessageType }>`
    position: fixed;
    z-index: 10;
    bottom: 20px;
    right: 30px;
    left: 380px;

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

    ${({ $type }) => {
        switch ($type) {
            case 'info':
                return css`
                    background: white;
                    border-color: black;
                `;
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
            default:
                return 'white';
        }
    }};

    padding-horizontal: 16px;
    align-items: center;

    a {
        color: black;
        font-weight: bold;
        text-decoration: underline;
    }
`;

export const CloseButton = styled.div`
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

    svg {
        width: 16px;
        height: 16px;
        color: white;
    }
`;

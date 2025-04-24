import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const ToggleButton = styled('button')<{ $isOpen?: boolean }>`
    background: #444;
    color: white;
    padding: 8px 10px;
    border-radius: 4px;
    cursor: pointer;

    position: fixed;
    top: 20px;
    right: 30px;
    z-index: 99999;
    pointer-events: all;

    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s ease;

    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    &:hover {
        background: #555;
        opacity: 1;
    }

    ${({ $isOpen }) =>
        $isOpen &&
        css`
            background: #555;
            opacity: 1;
        `}
`;

export const MenuWrapper = styled(m.div)`
    position: fixed;
    top: 20px;
    right: 30px;
    z-index: 99999;
    max-width: 420px;
`;

export const MenuContent = styled(m.div)`
    background: rgba(0, 0, 0, 0.8);
    padding: 16px 10px;
    border-radius: 8px;

    display: flex;
    flex-direction: column;
    gap: 10px;

    min-width: 320px;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

export const Button = styled('button')<{ $isActive?: boolean }>`
    background: ${({ $isActive }) => ($isActive ? '#666' : '#444')};
    color: white;
    border: 1px solid #666;
    padding: 4px 6px;
    border-radius: 4px;
    cursor: pointer;
    pointer-events: all;
    font-size: 11px;
    transition: background-color 0.2s ease;
    letter-spacing: -0.02rem;

    &:hover {
        background: ${({ $isActive }) => ($isActive ? '#666' : '#555')};
    }
`;

export const CategoryLabel = styled('div')`
    color: #999;
    font-size: 11px;
    text-transform: uppercase;
    padding-bottom: 2px;
    border-bottom: 1px solid #666;
`;

export const ButtonGroup = styled('div')`
    display: grid;
    grid-auto-flow: row;
    grid-template-columns: repeat(auto-fit, minmax(30%, 1fr));
    gap: 4px;
    padding-bottom: 4px;

    &:last-child {
        padding-bottom: 0;
    }
`;

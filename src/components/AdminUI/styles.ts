import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const ToggleButton = styled('button')<{ $isOpen?: boolean }>`
    background: #444;
    color: white;
    padding: 8px 0px;
    border-radius: 50px;
    cursor: pointer;
    width: 76px;

    position: fixed;
    top: 32px;
    left: 11px;
    z-index: 99999;
    pointer-events: all;

    font-size: 11px;
    opacity: 0;
    transition: opacity 0.2s ease;
    font-weight: 600;

    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    display: flex;
    justify-content: center;
    align-items: center;

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
    top: 10px;
    right: 30px;
    z-index: 99999;
    max-width: 360px;
`;

export const MenuContent = styled(m.div)`
    background: #444;
    padding: 20px;
    border-radius: 8px;

    display: flex;
    flex-direction: column;
    gap: 20px;

    min-width: 260px;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
`;

export const AdminButton = styled('button')<{ $isActive?: boolean }>`
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
    font-size: 10px;
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

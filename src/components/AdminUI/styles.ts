import styled from 'styled-components';

export const ToggleButton = styled('button')`
    background: #444;
    color: white;
    padding: 8px 20px;
    border-radius: 4px;
    cursor: pointer;

    position: fixed;
    top: 20px;
    right: 30px;
    z-index: 99999;
    pointer-events: all;

    font-size: 12px;

    &:hover {
        background: #555;
    }
`;

export const MenuWrapper = styled('div')`
    position: fixed;
    top: 20px;
    right: 30px;
    z-index: 99999;

    max-width: 350px;
`;

export const MenuContent = styled('div')`
    background: rgba(0, 0, 0, 0.8);
    padding: 10px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 200px;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
`;

export const Button = styled('button')`
    background: #444;
    color: white;
    border: 1px solid #666;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    pointer-events: all;
    font-size: 11px;
    transition: background-color 0.2s ease;

    &:hover {
        background: #555;
    }
`;

export const CategoryLabel = styled('div')`
    color: #999;
    font-size: 11px;
    text-transform: uppercase;
    margin-top: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #666;
`;

export const ButtonGroup = styled('div')`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
`;

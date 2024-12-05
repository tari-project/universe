import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: grid;
    align-items: center;
    grid-template-columns: auto 1fr;

    gap: 14px;
`;

export const PlaceholderText = styled('div')`
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    text-transform: uppercase;

    border-radius: 8.751px;
    background: rgba(217, 217, 217, 0.1);

    display: flex;
    justify-content: center;
    align-items: center;

    height: 35px;
    padding: 12px 16px;
`;

export const AddNewButton = styled('button')`
    width: 92px;
    height: 92px;
    border-radius: 100%;

    background: rgba(217, 217, 217, 0.1);

    border: none;

    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;

    cursor: pointer;

    transition: background 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

export const ScrollArea = styled('div')`
    display: flex;
    gap: 15px;
    overflow: hidden;
    padding: 6px 0;
`;

import styled from 'styled-components';

export const Wrapper = styled('div')`
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.8);
    padding: 10px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: all;
`;

export const Button = styled('button')`
    background: #444;
    color: white;
    border: 1px solid #666;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
        background: #555;
    }
`;

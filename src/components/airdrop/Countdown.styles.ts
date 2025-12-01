import styled from 'styled-components';

export const CountdownContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    min-width: fit-content;
    padding: 0 4px;
`;

export const CountdownSquare = styled.div`
    line-height: 1;
    background: rgba(255, 255, 255, 0.85);
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000000;
    flex: 1 0 max(32px, 33%);
    font-size: 12px;
    font-weight: 600;
    font-family: monospace;
    padding: 8px 4px;
    box-shadow: 0 0 7px 0 rgba(0, 0, 0, 0.13);
`;

export const CountdownWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
`;

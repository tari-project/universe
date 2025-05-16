import styled from 'styled-components';

export const WalletSettingsGrid = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 60px;
    grid-template-rows: auto;
    gap: 10px;
    grid-template-areas: 'input ctas';
    align-items: start;
`;

export const InputArea = styled.div`
    grid-area: input;
    display: flex;
    width: 100%;
    min-height: 36px;
`;

export const CTASArea = styled.div`
    grid-area: ctas;
    display: flex;
    width: 100%;
    justify-content: flex-end;
    align-items: center;
    gap: 6px;
    height: 36px;
`;

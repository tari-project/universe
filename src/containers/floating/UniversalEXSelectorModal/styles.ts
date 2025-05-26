import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: min(200px, 80vh);
    min-width: min(200px, 80vw);
`;

export const EXMinerList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
`;

export const EXMiner = styled.div<{ selected: boolean }>`
    cursor: pointer;
    padding: 14px 20px;
    border-radius: 16px;
    border: ${({ selected, theme }) =>
        selected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent'};
    background: ${({ selected, theme }) => (selected ? theme.palette.primary.light : theme.palette.background.paper)};
    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: ${({ selected }) => (selected ? 600 : 400)};
    transition:
        background 0.15s,
        border 0.15s;
    text-align: left;
`;

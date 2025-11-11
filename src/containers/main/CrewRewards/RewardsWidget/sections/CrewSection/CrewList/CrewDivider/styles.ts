import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    gap: 10px;

    color: rgba(255, 255, 255, 0.87);
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 600;
    line-height: 125%;
    white-space: nowrap;

    position: sticky;
    top: 0;
    z-index: 2;

    background: linear-gradient(to bottom, #323333 calc(100% - 10px), transparent 100%);
    padding: 0 0 10px 0;
`;

export const Line = styled.div`
    width: 100%;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
`;

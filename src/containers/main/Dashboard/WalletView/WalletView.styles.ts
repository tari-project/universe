import styled from 'styled-components';

export const WalletViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 60%;
    position: relative;
    pointer-events: all;
    height: 100%;
    padding: calc(5rem + 1.5vmin) calc(5rem + 1vmin) 0;
    & * {
        pointer-events: all;
    }
`;

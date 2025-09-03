import styled from 'styled-components';
export const TappletContainer = styled.div<{ $active?: boolean }>`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    pointer-events: ${({ $active }) => ($active ? 'all' : 'none')};
    z-index: ${({ $active }) => ($active ? 2 : 0)};
`;

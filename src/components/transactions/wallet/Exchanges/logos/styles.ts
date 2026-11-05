import styled from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
    height: 33px;
    width: 70px;
`;
export const Logo = styled.div<{ $index: number; $bgColour?: string }>`
    overflow: hidden;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    z-index: ${({ $index }) => $index + 1};
    top: 0;
    img {
        width: 100%;
    }

    width: 33px;
    height: 33px;
    border: 2px solid #fff;
    left: ${({ $index }) => `${$index * 15}px`};
`;

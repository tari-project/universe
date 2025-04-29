import styled from 'styled-components';

export const Wrapper = styled.div`
    border-radius: 10px;
    overflow: hidden;
    width: clamp(1000px, 80vw, 1300px);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
`;

export const Video = styled.video`
    width: 100%;
    height: auto;
`;

export const CTA = styled.button`
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    background: rgba(0, 0, 0, 0.75);
    transition: transform 0.2s ease-in;
    &:hover {
        transform: scale(1.15);
    }
`;

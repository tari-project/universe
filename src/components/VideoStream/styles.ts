import styled from 'styled-components';
import * as m from 'motion/react-m';

export const PlayerContainer = styled.div`
    position: relative;
    width: 100%;
`;
export const VideoElement = styled.video`
    width: 100%;
    display: block;
`;

export const PosterOverlay = styled(m.div)`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const PosterImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

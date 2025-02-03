import styled from 'styled-components';
import backgroundImage from '../images/friend_accepted_bg.png';
import * as m from 'motion/react-m';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 100%;
    height: 100%;

    color: #fff;
`;

export const Background = styled(m.div)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;

    background-color: #2a3342;
    background-image: url(${backgroundImage});
    background-size: cover;
    background-position: center;
`;

import { m } from 'motion';
import styled from 'styled-components';
import backgroundImage from '../images/bonus_gems_bg.png';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 100%;
    color: #000;
`;

export const Background = styled(m.div)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;

    background-image: url(${backgroundImage});
    background-size: cover;
    background-position: center;
`;

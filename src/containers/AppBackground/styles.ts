import clouds from '../../assets/backgrounds/clouds.png';
import styled from 'styled-components';

export const BackgroundImage = styled.div`
    background-color: ${(props) => props.theme.palette.background.default};
    background-size: cover;
    pointer-events: none;
    background-image: url(${clouds});
    background-position: center;
    position: absolute;
    height: 100%;
    width: 100%;
`;

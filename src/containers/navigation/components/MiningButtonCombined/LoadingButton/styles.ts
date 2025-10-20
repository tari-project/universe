import * as m from 'motion/react-m';
import styled from 'styled-components';

export const LoadingWrapper = styled(m.div)<{ $backgroundImage: string }>`
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 500px;
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: center;

    background-color: #188750;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-image: url(${({ $backgroundImage }) => $backgroundImage});

    box-shadow: 0 0 10px 0 rgba(104, 153, 55, 0.35);

    pointer-events: none;
    color: #fff;
    z-index: 4;
`;

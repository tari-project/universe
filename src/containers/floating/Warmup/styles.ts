import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    flex-flow: column;
    padding: calc(1vmin + 1.8rem);
`;

export const GraphicWrapper = styled.div`
    height: 100%;
    width: auto;
    position: absolute;
    img {
        height: 100%;
    }
`;
export const HeaderWrapper = styled.div`
    display: flex;
    flex-flow: column;
    position: relative;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    overflow: hidden;

    width: 720px;
    height: 264px;
    flex-shrink: 0;
`;

export const Heading = styled(Typography)`
    text-transform: uppercase;
`;

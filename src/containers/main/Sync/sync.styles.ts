import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled(m.div)`
    width: 100%;
    border: 1px solid deeppink;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: calc(1rem + 1vmin);
    box-sizing: border-box;
`;

export const HeaderImg = styled.img`
    max-width: 360px;
`;
export const Content = styled(m.div)`
    height: 100%;
    display: grid;
    border: 1px solid hotpink;
    grid-auto-columns: 100%;
    grid-template-rows: 5fr 3fr 1fr;
    
    :
`;

import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 100%;
    z-index: 2;
`;

export const Heading = styled.div`
    font-weight: 700;
    font-size: calc(2.6rem + 1vmin);
    color: ${({ theme }) => theme.palette.text.primary};
    text-transform: uppercase;
    line-height: 1;
    letter-spacing: -2px;
    white-space: pre-line;
`;

export const Copy = styled.div`
    font-size: min(calc(1rem + 1vmin), 30px);
    line-height: 1.2;
    letter-spacing: -0.8px;
`;

export const AnimatedTextContainer = styled(m.div)`
    height: max-content;
    span {
        white-space: break-spaces;
    }
`;

export const NavContainer = styled.div`
    grid-area: content;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: clamp(240px, 38vh, 340px);
`;

export const Nav = styled.div`
    display: flex;
    gap: 5px;
    position: relative;
    z-index: 2;
`;

export const NavItem = styled.div<{ $selected?: boolean }>`
    border-radius: 50px;
    position: relative;
    display: flex;
    width: 70px;
    height: 4px;
    cursor: pointer;

    transition: transform 0.3s ease;

    &:hover {
        transform: scaleY(2);
    }
`;

export const NavItemCurrent = styled(m.div)`
    border-radius: 50px;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    width: 71px;
    height: 4px;
    z-index: 1;
`;

export const GraphicContainer = styled(m.div)`
    position: fixed;
    pointer-events: none;
    width: 40vw;
    bottom: 0;
    right: -20px;
    height: 95vh;
    display: flex;
    align-items: end;
    justify-content: flex-end;
    z-index: 1;
    transition: height 0.3s ease;

    @media (max-width: 1200px) and (min-height: 850px) {
        height: 70vh;
    }
`;

export const StepImg = styled(m.img)`
    max-height: 100%;
    position: absolute;
    bottom: -10px;
    right: 0;
    pointer-events: none;
    z-index: 1;
`;

export const StepImgCloud = styled(m.img)`
    max-height: 100%;
    position: absolute;
    bottom: -10px;
    right: 0;
    pointer-events: none;
    z-index: 2;
`;

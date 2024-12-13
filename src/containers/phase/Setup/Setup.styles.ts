import styled from 'styled-components';

export const SetupWrapper = styled.div<{ $bg?: string }>`
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    padding: 0 40px 30px;
    background-image: ${({ $bg, theme }) => `${theme.gradients.setupBg}, url("${$bg}")`};
    background-blend-mode: darken;
    background-size: cover;
    background-position: center;
    display: grid;
    gap: 10px;
    grid-template-columns: 1fr 1.25fr;
    pointer-events: all;
    grid-template-rows: 35% 1.5fr minmax(100px, 1fr);
    grid-template-areas:
        'hero hero'
        'content .'
        'footer footer';

    @media (max-width: 1200px) {
        padding: 0 30px 20px;
    }
`;

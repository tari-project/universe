import styled from 'styled-components';
import clouds from '@app/assets/backgrounds/clouds.png';

export const SB_MINI_WIDTH = 78;
export const SB_WIDTH = 356;
export const SB_SPACING = 15;

export const DashboardContainer = styled.div<{ $disableBackground?: boolean }>`
    display: flex;
    flex-direction: column;
    position: relative;
    height: 100vh;
    width: 100%;
    padding: 10px;
    gap: 10px;
    max-height: 100%;
    background: ${({ theme, $disableBackground }) =>
        $disableBackground
            ? 'none'
            : `radial-gradient(140% 90% at 35% 20%, transparent 93%,  ${theme.palette.background.main} 98%)`};
`;

export const DashboardContent = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    position: relative;
`;

export const Background = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-image: ${({ theme }) => `${theme.gradients.radialBg}, url(${clouds}`});
    background-blend-mode: overlay;
    filter: ${({ theme }) => (theme.mode === 'dark' ? 'brightness(0.45)' : 'none')};
`;

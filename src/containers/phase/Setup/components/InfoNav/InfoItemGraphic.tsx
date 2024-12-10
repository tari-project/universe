import { useTheme } from 'styled-components';
import { GraphicContainer, StepImg } from './InfoNav.styles';

import coinsClouds from '/assets/img/setup/coins-clouds.png';
import coins from '/assets/img/setup/coins.png';
import cubesLight from '/assets/img/setup/cubes-light.png';
import cubes from '/assets/img/setup/cubes.png';
import fancyClouds from '/assets/img/setup/fancy-clouds.png';
import fancy from '/assets/img/setup/fancy.png';
import tariCloud from '/assets/img/setup/tari-cloud.png';
import tari from '/assets/img/setup/tari.png';
import towerClouds from '/assets/img/setup/tower-clouds.png';
import towerWinClouds from '/assets/img/setup/tower-win-clouds.png';
import towerWin from '/assets/img/setup/tower-win.png';
import tower from '/assets/img/setup/tower.png';

interface InfoItemGraphicProps {
    step?: number;
}

const transition = { duration: 0.8, ease: 'easeInOut' };

const wrapper = {
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            ...transition,
        },
    },
    hidden: {
        opacity: 0,
        y: -8,
        transition: {
            ...transition,
            duration: 0.2,
        },
    },
};

const graphic = {
    visible: { opacity: 1, transition: { ease: 'linear', duration: 0.3 } },
    hidden: { opacity: 0, transition: { ease: 'linear', duration: 0.2 } },
};

export default function InfoItemGraphic({ step = 1 }: InfoItemGraphicProps) {
    const theme = useTheme();
    const stepGraphics = [
        [towerWin, towerWinClouds],
        [fancy, fancyClouds],
        [coins, coinsClouds],
        [theme.mode === 'dark' ? cubes : cubesLight],
        [tower, towerClouds],
        [tari, tariCloud],
    ];
    const graphics = stepGraphics[step - 1];

    const graphicsMarkup = graphics?.map((img, i) => {
        const key = `step-${step}:img:${i}`;
        if (img) {
            return (
                <StepImg
                    key={key}
                    variants={graphic}
                    src={img}
                    alt={`Step ${step} image #${i + 1}`}
                    style={{ zIndex: i + 1 }}
                />
            );
        }
    });
    return (
        <GraphicContainer variants={wrapper} initial="hidden" animate="visible">
            {graphicsMarkup}
        </GraphicContainer>
    );
}

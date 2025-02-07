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
import { memo } from 'react';

interface InfoItemGraphicProps {
    step?: number;
}

const InfoItemGraphic = memo(function InfoItemGraphic({ step = 1 }: InfoItemGraphicProps) {
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
                    src={img}
                    alt={`Step ${step} image #${i + 1}`}
                    style={{ zIndex: i + 1 }}
                    $index={i}
                />
            );
        }
    });

    return (
        <GraphicContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {graphicsMarkup}
        </GraphicContainer>
    );
});

export default InfoItemGraphic;

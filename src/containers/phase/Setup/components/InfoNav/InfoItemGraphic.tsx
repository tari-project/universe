import { GraphicContainer, StepImg, StepImgCloud } from './InfoNav.styles';

import coinsClouds from '/assets/img/setup/coins-clouds.png';
import coins from '/assets/img/setup/coins.png';

import cubes from '/assets/img/setup/cubes.png';
import cubesClouds from '/assets/img/setup/cubes-clouds.png';
import fancyClouds from '/assets/img/setup/fancy-clouds.png';
import fancy from '/assets/img/setup/fancy.png';
import tariCloud from '/assets/img/setup/tari-cloud.png';
import tari from '/assets/img/setup/tari.png';
import towerClouds from '/assets/img/setup/tower-clouds.png';
import towerWinClouds from '/assets/img/setup/tower-win-clouds.png';
import towerWin from '/assets/img/setup/tower-win.png';
import tower from '/assets/img/setup/tower.png';
import { useParallax } from '@app/hooks/ui/useParallax';

interface InfoItemGraphicProps {
    step?: number;
}

export default function InfoItemGraphic({ step = 1 }: InfoItemGraphicProps) {
    const { x, y } = useParallax(10);
    const { x: x2, y: y2 } = useParallax(15);

    const stepGraphics = [
        [towerWin, towerWinClouds],
        [fancy, fancyClouds],
        [coins, coinsClouds],
        [cubes, cubesClouds],
        [tower, towerClouds],
        [tari, tariCloud],
    ];

    const [mainImage, cloudOverlay] = stepGraphics[step - 1];

    return (
        <GraphicContainer>
            <StepImg
                src={mainImage}
                alt={`Step ${step} main image`}
                style={{ x, y }}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 2, ease: 'anticipate' }}
            />
            {cloudOverlay && (
                <StepImgCloud
                    src={cloudOverlay}
                    alt={`Step ${step} cloud`}
                    style={{ x: x2, y: y2 }}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 2, ease: 'anticipate' }}
                />
            )}
        </GraphicContainer>
    );
}

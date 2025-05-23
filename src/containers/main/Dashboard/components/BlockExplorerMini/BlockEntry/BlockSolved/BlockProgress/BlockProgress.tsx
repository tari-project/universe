import { useState, useEffect, useMemo } from 'react';
import {
    BackgroundArc,
    CubeContainer,
    ProgressArc,
    SVGContainer,
    TextContainer,
    Wrapper,
    GradientStop,
} from './styles';
import CubeIcon from './CubeIcon';

interface BlockProgressProps {
    blocks: number;
    maxBlocks: number;
    isHovering?: boolean;
}

export default function BlockProgress({ blocks, maxBlocks, isHovering }: BlockProgressProps) {
    const [progress, setProgress] = useState(0);
    const percentage = (blocks / maxBlocks) * 100;

    const gradientId = useMemo(() => `progressGradient-${Math.random().toString(36).substring(2, 9)}`, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setProgress(percentage);
        }, 100);

        return () => clearTimeout(timer);
    }, [percentage]);

    const size = 51;
    const strokeWidth = 6;
    const color = `url(#${gradientId})`;
    const backgroundColor = '#E6E2DB';
    const animationDuration = 1000;

    const viewBoxSize = size + strokeWidth;
    const radius = size / 2;
    const center = viewBoxSize / 2;

    const gapAngle = Math.PI / 4;
    const startAngle = Math.PI / 2 + gapAngle;
    const endAngleMax = Math.PI * 2 + Math.PI / 2 - gapAngle;

    const progressRadians = (progress / 100) * (endAngleMax - startAngle);
    const endAngle = startAngle + progressRadians;

    const getCoordinatesForAngle = (angle: number) => {
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return { x: x + center, y: y + center };
    };

    const createArcPath = () => {
        if (progress === 0) return '';

        const startCoord = getCoordinatesForAngle(startAngle);
        const endCoord = getCoordinatesForAngle(endAngle);

        const largeArcFlag = progressRadians > Math.PI ? 1 : 0;

        return `
      M ${startCoord.x} ${startCoord.y}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endCoord.x} ${endCoord.y}
    `;
    };

    const backgroundPath = `
    M ${getCoordinatesForAngle(Math.PI / 2 + gapAngle).x} ${getCoordinatesForAngle(Math.PI / 2 + gapAngle).y}
    A ${radius} ${radius} 0 1 1 ${getCoordinatesForAngle(Math.PI / 2 - gapAngle).x} ${
        getCoordinatesForAngle(Math.PI / 2 - gapAngle).y
    }
  `;

    const startColor = isHovering ? '#E08E69' : '#FFA515';
    const endColor = isHovering ? '#AF72CF' : '#FFDD6C';

    return (
        <Wrapper $isHovering={isHovering}>
            <SVGContainer width={viewBoxSize} height={viewBoxSize} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="50%" x2="100%" y2="50%" gradientUnits="userSpaceOnUse">
                        <GradientStop offset="0%" $stopColor={startColor} />
                        <GradientStop offset="100%" $stopColor={endColor} />
                    </linearGradient>
                </defs>

                <BackgroundArc d={backgroundPath} stroke={backgroundColor} strokeWidth={strokeWidth} />

                <ProgressArc
                    d={createArcPath()}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    $animationDuration={animationDuration}
                />
            </SVGContainer>

            <CubeContainer>
                <CubeIcon isHovering={isHovering} />
            </CubeContainer>

            <TextContainer>{blocks}</TextContainer>
        </Wrapper>
    );
}

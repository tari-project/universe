import { backIn, circOut } from 'motion';
import { useTime, useTransform } from 'motion/react';
import CubeSvg from '@app/components/svgs/CubeSvg.tsx';
import { CubeWrapper, Orbit, OrbitWrapper } from './ButtonOrbitAnimation.styles.ts';

const orbitTracks = [{ size: 200 }, { size: 230 }, { size: 260 }, { size: 160 }];

const WRAPPER = 300;
const RADIUS = WRAPPER / 2;
export default function ButtonOrbitAnimation() {
    const time = useTime();
    const rotate = useTransform(time, [0, 55 * 1000], [0, 360], { clamp: false });
    const opacity = useTransform(time, [300, 1000, 1500], [0.95, 0.05, 0.8], { ease: circOut });

    const cubesPerTrack = Array.from({ length: 6 }).map((_, i) => i + 1);

    const evenStyle = {
        opacity,
        rotate,
    };

    const style = {
        opacity: useTransform(() => opacity.get() / 2),
        rotate: useTransform(() => rotate.get() * -1),
    };

    const trackMarkup = orbitTracks.map(({ size }, trackIndex) => {
        const styles = trackIndex % 2 === 0 ? evenStyle : style;
        const cubes =
            trackIndex % 2 === 0 ? cubesPerTrack.filter((c) => c % 2 === 0) : cubesPerTrack.filter((c) => c % 2 !== 0);
        return (
            <Orbit
                key={`orbit-track-${trackIndex}`}
                style={{
                    borderStyle: (trackIndex - 1) % 3 === 0 ? 'solid' : 'dashed',
                    width: size,
                    height: size,
                    y: RADIUS - size / 2,
                    x: RADIUS - size / 2,
                    ...styles,
                }}
            >
                {cubes.map((_, cubeIndex) => {
                    const third = (cubeIndex * trackIndex) % 3 === 0;
                    const x = (size / Math.PI) * (third ? 1 : 2);
                    const y = third ? -9 : -4.5;
                    return <OrbitCube key={`track-${trackIndex}-${size}:cube-${cubeIndex}`} x={x} y={y} />;
                })}
            </Orbit>
        );
    });

    return <OrbitWrapper>{trackMarkup}</OrbitWrapper>;
}

function OrbitCube({ x, y }: { x: number; y: number }) {
    const time = useTime();
    const opacity = useTransform(time, [300, 900, 1500], [0.4, 0.75, 0.6], {
        clamp: false,
        ease: backIn,
    });
    const scale = useTransform(time, [500, 1500], [0.7, 0.85], {
        clamp: false,
        ease: backIn,
    });
    return (
        <CubeWrapper style={{ opacity, scale, x, y }}>
            <CubeSvg />
        </CubeWrapper>
    );
}

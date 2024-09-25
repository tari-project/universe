import { CubeWrapper, Orbit, OrbitWrapper } from './ButtonOrbitAnimation.styles.ts';
import CubeSvg from '@app/components/svgs/CubeSvg.tsx';
import { useState } from 'react';
import { Transition, useAnimationFrame, Variants } from 'framer-motion';

const orbitTracks = [{ size: 200 }, { size: 230 }, { size: 260 }, { size: 160 }];

const opacityTransition = {
    duration: 15,
    ease: 'easeInOut',
    repeat: Infinity,
    delay: i * 2,
};
const cube = {
    animate: (i) => ({
        opacity: [0.75, 1, 0.9],
        scale: [0.8, 0.75],
        transition: opacityTransition,
    }),
};

const track: Variants = {
    animate: (i) => ({
        rotate: i % 3 !== 0 ? 360 : -360,
        opacity: [0.75, 8.2, 0.69],
        transition: {
            duration: 40 + (i + 1) * 1.5,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'mirror' as Transition['repeatType'],
            staggerChildren: 1.5,
            delay: i * 1.75,
            opacity: opacityTransition,
        },
    }),
};

function OrbitCube({ isEven, custom, x, y }: { isEven?: boolean; custom: number; x: number; y: number }) {
    return (
        <CubeWrapper style={{ x, y, rotate: isEven ? 5 : 0.5 }} variants={cube} animate="animate" custom={custom}>
            <CubeSvg />
        </CubeWrapper>
    );
}

const baseCubes = [1, 2];

export default function ButtonOrbitAnimation() {
    const [cubesPerTrack, setCubesPerTrack] = useState(baseCubes);

    useAnimationFrame((time, delta) => {
        if (delta > 20 && cubesPerTrack.length < 10) {
            setCubesPerTrack((c) => [...c, c.length + 1]);
        }
    });

    return (
        <OrbitWrapper
            key="orbit-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { staggerChildren: 1, staggerDirection: -1 } }}
            exit={{ opacity: 0 }}
        >
            {orbitTracks.map(({ size }, trackIndex) => {
                const isEven = trackIndex % 2 === 0;
                const borderStyleArr = ['solid', 'solid', 'solid'];
                borderStyleArr.splice(trackIndex, 0, 'dashed');
                const borderStyle = borderStyleArr.join(' ');
                const cubes = isEven
                    ? cubesPerTrack.filter((c) => c % 2 !== 0)
                    : cubesPerTrack.filter((c) => c % 2 === 0);
                return (
                    <Orbit
                        key={`orbit-${size}-${trackIndex}`}
                        style={{
                            opacity: isEven ? 0.8 : 0.65,
                            borderStyle,
                            width: size,
                            height: size,
                            y: 150 - size / 2,
                            x: 150 - size / 2,
                        }}
                        animate="animate"
                        variants={track}
                        custom={trackIndex}
                    >
                        {cubes.map((cube, cubeIndex) => {
                            const third = (cubeIndex * trackIndex) % 3 === 0;
                            const x = (size / Math.PI) * (third ? 1 : 2);
                            const y = third ? -9 : -4.5;
                            return (
                                <OrbitCube
                                    key={`track-${trackIndex}-${size}:cube-${cubeIndex}`}
                                    isEven={isEven}
                                    custom={cube}
                                    x={x}
                                    y={y}
                                />
                            );
                        })}
                    </Orbit>
                );
            })}
        </OrbitWrapper>
    );
}

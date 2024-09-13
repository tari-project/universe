import { Orbit, OrbitWrapper, CubeWrapper } from './ButtonOrbitAnimation.styles.ts';
import CubeSvg from '@app/components/svgs/CubeSvg.tsx';
import { Transition } from 'framer-motion';

const orbitTransition: Transition = {
    duration: 5,
    ease: 'linear',
    repeat: Infinity,
    delayChildren: 0.2,
    staggerDirection: -1,
    opacity: {
        duration: 0.5,
        times: [0.9, 0.62, 1],
        ease: 'easeInOut',
    },
};
const orbitTracks = [{ size: 260 }, { size: 230 }, { size: 200 }, { size: 160 }];

export default function ButtonOrbitAnimation() {
    return (
        <OrbitWrapper layout key="orbit">
            {orbitTracks.map(({ size }, index) => (
                <Orbit
                    key={size}
                    style={{
                        width: size,
                        height: size,
                        y: 150 - size / 2,
                        x: 150 - size / 2,
                    }}
                    transition={{ ...orbitTransition, delay: index + 2 }}
                    animate={{ opacity: [0.9, 1, 0.8], rotate: index % 2 === 0 ? 360 : -360 }}
                >
                    {index % 2 === 0 ? (
                        <CubeWrapper style={{ x: (size / Math.PI) * 2, y: -6 }}>
                            <CubeSvg />
                        </CubeWrapper>
                    ) : (
                        <CubeWrapper style={{ x: size / Math.PI, y: -12 }}>
                            <CubeSvg />
                        </CubeWrapper>
                    )}

                    {index % 2 === 0 ? (
                        <CubeWrapper style={{ x: (size / Math.PI) * 2, y: -6 }}>
                            <CubeSvg />
                        </CubeWrapper>
                    ) : null}
                </Orbit>
            ))}
        </OrbitWrapper>
    );
}

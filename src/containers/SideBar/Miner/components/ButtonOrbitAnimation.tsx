import { Orbit, OrbitWrapper, CubeWrapper } from './ButtonOrbitAnimation.styles.ts';
import CubeSvg from '@app/components/svgs/CubeSvg.tsx';
import { Transition } from 'framer-motion';

const orbitTransition: Transition = {
    duration: 7.5,
    ease: 'linear',
    repeat: Infinity,
    staggerChildren: 1,
    staggerDirection: 1,
    opacity: {
        duration: 0.5,
        ease: 'easeInOut',
    },
};
const orbitTracks = [{ size: 260 }, { size: 230 }, { size: 200 }, { size: 160 }];

export default function ButtonOrbitAnimation() {
    return (
        <OrbitWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {orbitTracks.map(({ size }, index) => (
                <Orbit
                    key={size}
                    style={{
                        opacity: index % 2 === 0 ? 0.7 : 1,
                        width: size,
                        height: size,
                        y: 150 - size / 2,
                        x: 150 - size / 2,
                    }}
                    transition={{ ...orbitTransition, delay: index * 1.5 }}
                    animate={{ rotate: index % 2 === 0 ? 360 : -360, opacity: [0.7, 0.5, 0.8, 1] }}
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

                    {index % 2 !== 0 ? (
                        <CubeWrapper style={{ x: (size / Math.PI) * 2, y: -6 }}>
                            <CubeSvg />
                        </CubeWrapper>
                    ) : (
                        <CubeWrapper style={{ x: size / Math.PI, y: -12 }}>
                            <CubeSvg />
                        </CubeWrapper>
                    )}
                </Orbit>
            ))}
        </OrbitWrapper>
    );
}

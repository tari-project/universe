import { ButtonWrapper, Orbit, OrbitWrapper, CubeWrapper } from './FancyButton.styles.ts';
import CubeSvg from '@app/components/svgs/CubeSvg.tsx';
import { Transition } from 'framer-motion';

const orbitTransition: Transition = {
    duration: 3,
    ease: 'linear',
    repeat: Infinity,
};
const orbitTracks = [{ size: 230 }, { size: 200 }, { size: 160 }, { size: 130 }];

export default function FancyMiningButton() {
    return (
        <ButtonWrapper>
            <OrbitWrapper>
                {orbitTracks.map(({ size }, index) => (
                    <Orbit
                        key={size}
                        style={{
                            width: size,
                            height: size,
                            y: 150 - size / 2,
                            x: 150 - size / 2,
                        }}
                        transition={orbitTransition}
                    >
                        <CubeWrapper style={{ x: (size / Math.PI) * 2, y: 0 }}>
                            <CubeSvg />
                        </CubeWrapper>

                        <CubeWrapper style={{ x: 0, y: (size / Math.PI) * 2 }}>
                            <CubeSvg />
                        </CubeWrapper>
                    </Orbit>
                ))}
            </OrbitWrapper>
        </ButtonWrapper>
    );
}

import { ButtonWrapper, Orbit, OrbitWrapper, CubeWrapper } from './FancyButton.styles.ts';
import CubeSvg from '@app/components/svgs/CubeSvg.tsx';
import { Transition } from 'framer-motion';

const orbitTransition: Transition = {
    duration: 5,
    ease: 'linear',
    repeat: Infinity,
    delayChildren: 5,
    staggerDirection: -1,
    opacity: [0.2, 0.8],
};
const orbitTracks = [{ size: 230 }, { size: 200 }, { size: 160 }, { size: 130 }];

const animate = {
    rotate: 360,
};

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
                        transition={{ ...orbitTransition, delay: index + 2 }}
                        animate={animate}
                    >
                        {index % 2 === 0 ? (
                            <CubeWrapper style={{ x: (size / (index + 1) / Math.PI) * 2, y: -6 }}>
                                <CubeSvg />
                            </CubeWrapper>
                        ) : (
                            <CubeWrapper style={{ x: (size / Math.PI) * 1.2, y: (size / Math.PI) * 2.7 }}>
                                <CubeSvg />
                            </CubeWrapper>
                        )}
                    </Orbit>
                ))}
            </OrbitWrapper>
        </ButtonWrapper>
    );
}

//          <CubeWrapper style={{ x: (size / Math.PI) * 2, y: 0 }}>
//                             <CubeSvg />
//                         </CubeWrapper>
//
//                         <CubeWrapper style={{ x: 0, y: (size / Math.PI) * 2 }}>
//                             <CubeSvg />
//                         </CubeWrapper>

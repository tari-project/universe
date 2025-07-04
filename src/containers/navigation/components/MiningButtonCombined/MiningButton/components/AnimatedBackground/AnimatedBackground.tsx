import CubeIcon from './icons/CubeIcon';
import {
    AnimatedCubeWrapper,
    CubePath,
    CubeStartPosition,
    IndividualCubeWrapper,
    Ring,
    Rings,
    Wrapper,
} from './styles';

const RINGS = [{ size: 171 }, { size: 215 }, { size: 275 }, { size: 331 }, { size: 409 }, { size: 477 }];

const CUBE_DEFINITIONS = [
    { size: 171, duration: 25, count: 4, initialDelay: 0, rotationDuration: 10 },
    { size: 215, duration: 30, count: 4, initialDelay: -7, rotationDuration: 12 },
    { size: 275, duration: 35, count: 4, initialDelay: -14, rotationDuration: 15 },
    { size: 331, duration: 40, count: 4, initialDelay: -21, rotationDuration: 17 },
    { size: 409, duration: 45, count: 4, initialDelay: -28, rotationDuration: 20 },
];

const CUBES = CUBE_DEFINITIONS.flatMap((def, defIndex) =>
    Array.from({ length: def.count }, (_, i) => ({
        id: `${defIndex}-${i}`,
        size: def.size,
        duration: def.duration,
        delay: def.initialDelay,
        rotationDuration: def.rotationDuration,
        startAngle: (360 / def.count) * i,
    }))
);

export default function AnimatedBackground() {
    return (
        <Wrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Rings>
                {RINGS.map((ring) => (
                    <Ring key={ring.size} $size={ring.size} />
                ))}
                {CUBES.map((cube) => (
                    <CubePath key={cube.id} $size={cube.size}>
                        <CubeStartPosition $startAngle={cube.startAngle}>
                            <AnimatedCubeWrapper $duration={cube.duration} $delay={cube.delay}>
                                <IndividualCubeWrapper $rotationDuration={cube.rotationDuration}>
                                    <CubeIcon />
                                </IndividualCubeWrapper>
                            </AnimatedCubeWrapper>
                        </CubeStartPosition>
                    </CubePath>
                ))}
            </Rings>
        </Wrapper>
    );
}

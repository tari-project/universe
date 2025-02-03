import * as m from 'motion/react-m';

interface ArrowProps {
    delay: number;
    path: string;
    strokeWidth: string;
}

const Arrow = ({ delay, path, strokeWidth }: ArrowProps) => (
    <m.path
        d={path}
        stroke="#C5FF47"
        strokeWidth={strokeWidth}
        strokeMiterlimit="10"
        strokeLinecap="square"
        initial={{ opacity: 0, y: 0 }}
        animate={{
            opacity: [0, 1, 0],
            y: [0, -20, -40],
            transition: {
                duration: 2.5,
                repeat: Infinity,
                ease: 'linear',
                delay,
            },
        }}
    />
);

const paths = [
    { delay: 0.8, path: 'M12.5391 4.76923L9.76983 2L7.0006 4.76923M9.76983 2.38462L9.76983 8', strokeWidth: '1.69231' },
    {
        delay: 1.6,
        path: 'M32.3828 16.6153L27.7674 11.9998L23.1519 16.6153M27.7674 12.6409L27.7674 22',
        strokeWidth: '2.82056',
    },
    {
        delay: 1.2,
        path: 'M7.53906 27.7692L4.76983 25L2.0006 27.7692M4.76983 25.3846L4.76983 31',
        strokeWidth: '1.69231',
    },
    {
        delay: 2.0,
        path: 'M36.5391 38.7692L33.7698 36L31.0006 38.7692M33.7698 36.3846L33.7698 42',
        strokeWidth: '1.69231',
    },
    { delay: 0, path: 'M22 33.9993L15 26.9993L8 33.9993M15 27.9716L15 42.166', strokeWidth: '4.27778' },
];

const AnimatedArrows = () => (
    <svg width="38" height="120" viewBox="0 0 38 120" fill="none">
        <g transform="translate(0, 40)">
            {paths.map((props, i) => (
                <Arrow key={i} {...props} />
            ))}
        </g>
    </svg>
);

export default AnimatedArrows;

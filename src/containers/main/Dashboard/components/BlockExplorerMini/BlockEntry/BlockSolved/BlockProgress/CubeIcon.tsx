import * as m from 'motion/react-m';

interface CubeIconProps {
    isHovering?: boolean;
}

const CubeIcon = ({ isHovering }: CubeIconProps) => {
    const topPathVariants = {
        default: { y: 0, x: 0 },
        hover: { y: -1, x: 0 },
    };

    const rightPathVariants = {
        default: { y: 0, x: 0 },
        hover: { y: 0, x: 1 },
    };

    const leftPathVariants = {
        default: { y: 0, x: 0 },
        hover: { y: 0, x: -1 },
    };

    const animationState = isHovering ? 'hover' : 'default';

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="24"
            viewBox="-1 -1 22 24"
            fill="none"
            style={{ willChange: 'transform' }}
        >
            <g>
                <m.path
                    d="M19.9981 5.80258L10.0469 11.6052L0.0285645 5.80258L9.98178 0L19.9981 5.80258Z"
                    fill="url(#paint0_linear_7608_68884)"
                    variants={topPathVariants}
                    animate={animationState}
                    transition={{ type: 'spring', stiffness: 100, damping: 25, mass: 1.5 }}
                />
                <m.path
                    d="M19.998 5.80249L19.9696 16.1973L10.0164 21.9999L10.0469 11.6051L19.998 5.80249Z"
                    fill="url(#paint1_linear_7608_68884)"
                    variants={rightPathVariants}
                    animate={animationState}
                    transition={{ type: 'spring', stiffness: 100, damping: 25, mass: 1.5 }}
                />
                <m.path
                    d="M10.0468 11.6051L10.0163 21.9999L0 16.1973L0.0284784 5.80249L10.0468 11.6051Z"
                    fill="url(#paint2_linear_7608_68884)"
                    variants={leftPathVariants}
                    animate={animationState}
                    transition={{ type: 'spring', stiffness: 100, damping: 25, mass: 1.5 }}
                />
                <g>
                    <m.path
                        d="M0.0324707 5.79858C2.99219 7.50486 7.17649 9.8459 10.0487 11.6012L10.0447 11.6093C7.11547 9.99489 2.93524 7.51915 0.0324707 5.79858Z"
                        fill="white"
                        variants={topPathVariants}
                        animate={animationState}
                        transition={{ type: 'spring', stiffness: 100, damping: 25, mass: 1.5 }}
                    />
                    <m.path
                        d="M10.0448 11.6012C12.978 9.88264 17.0627 7.4171 19.9959 5.79858L20 5.80675C17.1623 7.54364 12.9597 9.93774 10.0427 11.6012H10.0448Z"
                        fill="white"
                        variants={topPathVariants}
                        animate={animationState}
                        transition={{ type: 'spring', stiffness: 100, damping: 25, mass: 1.5 }}
                    />
                    <m.path
                        d="M10.0508 11.6052C10.059 14.6729 10.1302 18.9773 10.0508 22.0001H10.0427C9.97149 18.9998 10.0183 14.6341 10.0508 11.6052Z"
                        fill="white"
                        animate={animationState}
                        transition={{ type: 'spring', stiffness: 100, damping: 25, mass: 1.5 }}
                    />
                </g>
            </g>
            <defs>
                <linearGradient
                    id="paint0_linear_7608_68884"
                    x1="0.0285643"
                    y1="5.80258"
                    x2="38.5333"
                    y2="-12.3169"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#E6E2DB" />
                    <stop offset="1" stopColor="#AFA695" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_7608_68884"
                    x1="10.0164"
                    y1="13.9012"
                    x2="0.203502"
                    y2="13.9012"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#E7E2D9" />
                    <stop offset="1" stopColor="#E6E2DB" />
                </linearGradient>
                <linearGradient
                    id="paint2_linear_7608_68884"
                    x1="-5.83313e-08"
                    y1="13.9012"
                    x2="23"
                    y2="9.99976"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#E6E2DB" />
                    <stop offset="1" stopColor="#AFA695" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default CubeIcon;

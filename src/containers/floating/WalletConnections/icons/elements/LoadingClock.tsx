// export const LoadingClock = ({ width }: { width?: string }) => {
//     return (
//         <svg xmlns="http://www.w3.org/2000/svg" width={width} fill="none" viewBox="0 0 63 63">
//             <path
//                 stroke="#F70"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="3.938"
//                 d="M21.986 7.875c-.562.21-1.114.439-1.656.686m34.054 34.23c.268-.581.515-1.174.74-1.777m-6.565 9.818c.45-.42.887-.857 1.306-1.309m-9.784 6.58c.51-.193 1.01-.4 1.504-.623m-9.676 2.254c-.606.021-1.216.021-1.823 0m-9.645-2.24c.475.213.957.413 1.447.598m-9.623-6.425c.359.38.73.75 1.11 1.108m-6.464-9.656c.196.52.409 1.03.637 1.533m-2.285-9.826a26.448 26.448 0 0 1 0-1.643m1.629-8.248c.193-.513.402-1.018.626-1.515m4.704-7.037c.38-.404.772-.797 1.177-1.176"
//                 opacity=".4"
//             />
//             <path
//                 stroke="#F70"
//                 strokeLinecap="round"
//                 strokeWidth="3.938"
//                 d="M35.438 31.5a3.938 3.938 0 1 1-3.938-3.938m3.938 3.938a3.938 3.938 0 0 0-3.938-3.938m3.938 3.938H42m-10.5-3.938V15.75"
//                 opacity=".4"
//             />
//             <path
//                 stroke="#F70"
//                 strokeLinecap="round"
//                 strokeWidth="3.938"
//                 d="M57.75 31.5c0-14.497-11.753-26.25-26.25-26.25"
//             />
//         </svg>
//     );
// };

import { useEffect, useState } from 'react';

export const LoadingClock = ({ width = '63' }: { width?: string }) => {
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setRotation((prev) => (prev + 6) % 360); // Move 6 degrees each tick (360/60 = 6 degrees per minute)
        }, 1000); // Update every second

        return () => clearInterval(interval);
    }, []);

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} fill="none" viewBox="0 0 63 63">
            {/* Clock face and hour marks */}
            <path
                stroke="#F70"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3.938"
                d="M21.986 7.875c-.562.21-1.114.439-1.656.686m34.054 34.23c.268-.581.515-1.174.74-1.777m-6.565 9.818c.45-.42.887-.857 1.306-1.309m-9.784 6.58c.51-.193 1.01-.4 1.504-.623m-9.676 2.254c-.606.021-1.216.021-1.823 0m-9.645-2.24c.475.213.957.413 1.447.598m-9.623-6.425c.359.38.73.75 1.11 1.108m-6.464-9.656c.196.52.409 1.03.637 1.533m-2.285-9.826a26.448 26.448 0 0 1 0-1.643m1.629-8.248c.193-.513.402-1.018.626-1.515m4.704-7.037c.38-.404.772-.797 1.177-1.176"
                opacity=".4"
            />

            {/* Hour hand - doesn't move in this animation */}
            <line
                x1="31.5"
                y1="31.5"
                x2="31.5"
                y2="20.5"
                stroke="#F70"
                strokeLinecap="round"
                strokeWidth="3.938"
                opacity="0.4"
            />

            {/* Minute hand - rotates */}
            <line
                x1="31.5"
                y1="31.5"
                x2="42"
                y2="31.5"
                stroke="#F70"
                strokeLinecap="round"
                strokeWidth="3.938"
                opacity="0.4"
                transform={`rotate(${rotation}, 31.5, 31.5)`}
            />

            {/* Arc showing progress */}
            <path
                stroke="#F70"
                strokeLinecap="round"
                strokeWidth="3.938"
                d="M57.75 31.5c0-14.497-11.753-26.25-26.25-26.25"
            />

            {/* Clock center
             <circle cx="31.5" cy="31.5" r="3.938" stroke="#F70" strokeWidth="3.938" opacity="0.4" fill="none" />
            */}
        </svg>
    );
};

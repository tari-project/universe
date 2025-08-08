import { useEffect, useState } from 'react';

type Seed = number;

const hashString = (str: string): Seed => {
    let hash: Seed = 0;
    for (let i = 0; i < str.length; i++) {
        const char: number = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return hash;
};

const seededRandom = (seed: Seed): number => {
    const x: number = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

const generateColor = (seed: Seed): string => {
    const r: number = Math.floor(seededRandom(seed) * 256);
    const g: number = Math.floor(seededRandom(seed + 1) * 256);
    const b: number = Math.floor(seededRandom(seed + 2) * 256);
    return `rgb(${r}, ${g}, ${b})`;
};

interface GradientOptions {
    username: string;
    fallback?: string;
    image?: string;
}

interface StyleObject {
    backgroundColor: string;
    backgroundImage: string;
    backgroundSize?: string;
    backgroundPosition?: string;
}

export function useAvatarGradient({ username, image, fallback = 'rgb(0, 0, 0, 0.15)' }: GradientOptions): StyleObject {
    const [style, setStyle] = useState<StyleObject>({
        backgroundColor: fallback,
        backgroundImage: 'none',
    });

    useEffect(() => {
        if (image) {
            setStyle({
                backgroundColor: fallback,
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            });
        } else if (username) {
            const seed = hashString(username);
            const color1 = generateColor(seed);
            const color2 = generateColor(seed + 3);
            const xPos = Math.floor(seededRandom(seed + 6) * 100);
            const yPos = Math.floor(seededRandom(seed + 7) * 100);

            setStyle({
                backgroundColor: fallback,
                backgroundImage: `radial-gradient(circle at ${xPos}% ${yPos}%, ${color1}, ${color2})`,
            });
        } else {
            setStyle({
                backgroundColor: fallback,
                backgroundImage: 'none',
            });
        }
    }, [username, fallback, image]);

    return style;
}

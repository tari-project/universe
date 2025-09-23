import { AvatarWrapper } from './styles';

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

const firstLetter = (username: string): string => {
    return username.charAt(0).toUpperCase();
};

interface Props {
    username?: string;
    image?: string;
    size?: number;
}

export default function Avatar({ username, image, size }: Props) {
    const finalUsername = username ? `@${username}` : '';
    let finalImage = `url(${image})`;
    let finalLetter = '';

    if (!image && username) {
        const seed = hashString(username);
        const color1 = generateColor(seed);
        const color2 = generateColor(seed + 3);
        const xPos = Math.floor(seededRandom(seed + 6) * 100);
        const yPos = Math.floor(seededRandom(seed + 7) * 100);

        finalImage = `radial-gradient(circle at ${xPos}% ${yPos}%, ${color1}, ${color2})`;
        finalLetter = firstLetter(username);
    }

    return (
        <AvatarWrapper $image={finalImage} aria-label={finalUsername} title={finalUsername} $size={size ?? 38}>
            {finalLetter}
        </AvatarWrapper>
    );
}

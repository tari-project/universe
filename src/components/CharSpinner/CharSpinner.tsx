import { Character, Characters, Wrapper } from './CharSpinner.styles.ts';

const transition = {
    type: 'spring',
    bounce: 0.25,
    duration: 1.14,
    staggerChildren: 0.2,
    delayChildren: 0.1,
};

export type CharSpinnerVariant = 'simple' | 'large';
interface CharSpinnerProps {
    value: string;
    variant?: CharSpinnerVariant;
    fontSize?: number;
}

const sizing = {
    large: {
        width: 48,
        height: 52,
        font: 45,
    },
    simple: {
        width: 18,
        height: 36,
        font: 36,
    },
};

export default function CharSpinner({ value, variant = 'large', fontSize: fontSizeProp }: CharSpinnerProps) {
    const letterHeight = sizing[variant].height;
    const letterWidth = sizing[variant].width;
    const fontSize = fontSizeProp || sizing[variant].font;

    const charArray = value.split('').map((c) => c);

    const charMarkup = charArray.map((char, i) => {
        if (char === ',' || char === '.') {
            return (
                <Character
                    key={`dec-${i}`}
                    initial={{ y: letterHeight }}
                    animate={{ y: 0 }}
                    transition={transition}
                    $letterHeight={letterHeight}
                    $fontSize={fontSize}
                    $variant={variant}
                >
                    <span key={`dec-${i}`}>{char}</span>
                </Character>
            );
        }
        const y = parseInt(char) * letterHeight;
        return (
            <Character
                key={`char-${i}-${char}`}
                initial={{ y: 0 }}
                animate={{ y: `-${y}px` }}
                transition={transition}
                $letterHeight={letterHeight}
                $fontSize={fontSize}
                $variant={variant}
            >
                {[...Array(10)].reverse().map((_, index) => (
                    <span key={`number-scroll-${i}-${char}-${index}-num`}>{index}</span>
                ))}
            </Character>
        );
    });
    return (
        <Wrapper style={{ width: letterWidth * charArray.length }} $letterHeight={letterHeight}>
            <Characters>{charMarkup}</Characters>
        </Wrapper>
    );
}

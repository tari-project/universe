import { Character, Characters, CharacterWrapper, SpinnerWrapper, Wrapper } from './CharSpinner.styles.ts';

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
    fontSize: number;
    variant?: CharSpinnerVariant;
}

const sizing = {
    large: {
        widthDiv: 1,
        hiddenX: 90,
    },
    simple: {
        widthDiv: 1.9,
        hiddenX: 10,
    },
};

export default function CharSpinner({ value, variant = 'large', fontSize }: CharSpinnerProps) {
    const letterHeight = Math.ceil(fontSize * 1.01);
    const charArray = value.split('').map((c) => c);

    const letterWidth = Math.ceil(fontSize / sizing[variant].widthDiv);

    const charMarkup = charArray.map((char, i) => {
        const isNum = !isNaN(Number(char));
        const isDec = char === '.';
        if (!isNum) {
            return (
                <Characters
                    $decimal={isDec}
                    key={`dec-${i}`}
                    initial={{ y: letterHeight }}
                    animate={{ y: 0 }}
                    transition={transition}
                    $letterHeight={letterHeight}
                    $fontSize={fontSize}
                    $letterWidth={letterWidth}
                    $variant={variant}
                >
                    {isDec ? (
                        <Character $decimal={isDec} $letterWidth={letterWidth} $fontSize={fontSize}>
                            {char}
                        </Character>
                    ) : (
                        <Character
                            key={`${i}-${char}`}
                            $letterWidth={letterWidth}
                            $fontSize={fontSize - 8}
                            style={{ marginTop: '2px' }}
                        >
                            {char}
                        </Character>
                    )}
                </Characters>
            );
        }
        const y = parseInt(char) * letterHeight;

        return (
            <Characters
                key={`char-${i}-${char}`}
                initial={{ y: 0 }}
                animate={{ y: `-${y}px` }}
                transition={transition}
                $letterHeight={letterHeight}
                $fontSize={fontSize}
                $variant={variant}
            >
                {[...Array(10)].reverse().map((_, index) => (
                    <Character key={`${i}-${char}-${index}`} $letterWidth={letterWidth} $fontSize={fontSize}>
                        {index}
                    </Character>
                ))}
            </Characters>
        );
    });

    return (
        <Wrapper>
            <SpinnerWrapper style={{ height: letterHeight }}>
                <CharacterWrapper style={{ height: letterHeight * 10 }}>{charMarkup}</CharacterWrapper>
            </SpinnerWrapper>
            <span>tXTM</span>
        </Wrapper>
    );
}

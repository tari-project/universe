import { Character, Characters, CharacterWrapper, HiddenNumberSpacer, Wrapper } from './CharSpinner.styles.ts';
import { useRef } from 'react';

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
        widthDiv: 1.15,
        offSet: 50,
    },
    simple: {
        widthDiv: 1.6,
        offSet: 20,
    },
};

export default function CharSpinner({ value, variant = 'large', fontSize }: CharSpinnerProps) {
    const letterHeight = Math.ceil(fontSize * 1.01);
    const charArray = value.split('').map((c) => c);
    const hiddenRef = useRef<HTMLDivElement>(null);
    const hiddenWidth = hiddenRef.current?.clientWidth;
    const letterWidth = Math.floor(fontSize / sizing[variant].widthDiv);

    const charMarkup = charArray.map((char, i) => {
        const isNum = !isNaN(Number(char));
        const isDec = char === '.';
        if (isDec) {
            return (
                <Characters
                    $notNum
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
                    <Character $notNum $decimal={isDec} $letterWidth={letterWidth}>
                        {char}
                    </Character>
                </Characters>
            );
        }
        const y = parseInt(char) * letterHeight;
        return (
            <Characters
                $notNum={!isNum}
                key={`char-${i}-${char}`}
                initial={{ y: 0 }}
                animate={{ y: `-${y}px` }}
                transition={transition}
                $letterHeight={letterHeight}
                $offSet={sizing[variant].offSet}
                $letterWidth={letterWidth}
                $fontSize={fontSize}
                $variant={variant}
            >
                {[...Array(10)].reverse().map((_, index) => (
                    <Character
                        key={`${i}-${char}-${index}`}
                        $notNum={!isNum}
                        $letterWidth={letterWidth}
                        $offSet={sizing[variant].offSet}
                    >
                        {isNum ? index : char}
                    </Character>
                ))}
            </Characters>
        );
    });

    return (
        <Wrapper $letterHeight={letterHeight}>
            <CharacterWrapper style={{ width: hiddenWidth }}>{charMarkup}</CharacterWrapper>
            <HiddenNumberSpacer ref={hiddenRef}>
                {charArray.map((char, index) => {
                    const isNum = !isNaN(Number(char));
                    const isDec = char === '.';
                    if (isDec) {
                        return (
                            <Characters
                                $notNum
                                $decimal={isDec}
                                key={`dec-${char}-${index}`}
                                initial={{ y: letterHeight }}
                                animate={{ y: 0 }}
                                transition={transition}
                                $letterHeight={letterHeight}
                                $fontSize={fontSize}
                                $letterWidth={letterWidth}
                                $variant={variant}
                                style={{ width: '14px' }}
                            >
                                {char}
                            </Characters>
                        );
                    }

                    return (
                        <Characters
                            $notNum={!isNum}
                            $letterHeight={letterHeight}
                            $letterWidth={letterWidth}
                            $fontSize={fontSize}
                            $variant={variant}
                            key={`${index}-number-ref`}
                        >
                            {char}
                        </Characters>
                    );
                })}
            </HiddenNumberSpacer>
        </Wrapper>
    );
}

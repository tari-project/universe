import {
    Character,
    Characters,
    CharacterWrapper,
    HiddenNumberSpacer,
    SpinnerWrapper,
    Wrapper,
} from './CharSpinner.styles.ts';
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
        widthDiv: 1.1,
        offSet: 50,
    },
    simple: {
        widthDiv: 1.9,
        offSet: 30,
    },
};

export default function CharSpinner({ value, variant = 'large', fontSize }: CharSpinnerProps) {
    const letterHeight = Math.ceil(fontSize * 1.01);
    const charArray = value.split('').map((c) => c);
    const hiddenRef = useRef<HTMLDivElement>(null);
    const hiddenWidth = hiddenRef.current?.offsetWidth;
    const letterWidth = hiddenWidth
        ? (hiddenWidth + 5) / charArray.length
        : Math.ceil(fontSize / sizing[variant].widthDiv) + 5;

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
                    <Character $notNum $decimal={isDec} $letterWidth={letterWidth} $fontSize={fontSize}>
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
                $letterWidth={letterWidth}
                $fontSize={fontSize}
                $variant={variant}
            >
                {isNum ? (
                    [...Array(10)].reverse().map((_, index) => (
                        <Character
                            key={`${i}-${char}-${index}`}
                            $letterWidth={letterWidth}
                            $offSet={sizing[variant].offSet}
                            $fontSize={fontSize}
                        >
                            {index}
                        </Character>
                    ))
                ) : (
                    <Character
                        key={`${i}-${char}`}
                        $notNum
                        $letterWidth={letterWidth}
                        $fontSize={fontSize - 8}
                        style={{ marginTop: '2px', border: '1px sold pink' }}
                    >
                        {char}
                    </Character>
                )}
            </Characters>
        );
    });

    return (
        <Wrapper $letterHeight={letterHeight}>
            <SpinnerWrapper style={{ width: hiddenWidth }}>
                <CharacterWrapper style={{ width: hiddenWidth }}>{charMarkup}</CharacterWrapper>
                <HiddenNumberSpacer ref={hiddenRef} $fontSize={fontSize}>
                    {charArray.map((char, index) => {
                        const isDec = char === '.';
                        if (isDec) {
                            return (
                                <Characters
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
            </SpinnerWrapper>
            <span>tXTM</span>
        </Wrapper>
    );
}

import { Trans } from 'react-i18next';
import { Character, Characters, CharacterWrapper, SpinnerWrapper, Wrapper, XTMWrapper } from './CharSpinner.styles.ts';
import { LayoutGroup } from 'framer-motion';

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
    XTMAlignment?: 'baseline' | 'center';
    animateNumbers?: boolean;
}

const sizing = {
    large: {
        widthDiv: 0.9991,
        hiddenX: 90,
    },
    simple: {
        widthDiv: 1.9,
        hiddenX: 10,
    },
};

export default function CharSpinner({
    value,
    variant = 'large',
    fontSize,
    XTMAlignment = 'baseline',
    animateNumbers = true,
}: CharSpinnerProps) {
    const letterHeight = Math.ceil(fontSize * 1.01);
    const charArray = value.split('').map((c) => c);
    const letterWidth = Math.floor(fontSize / sizing[variant].widthDiv);

    const charMarkup = charArray.map((char, i) => {
        const isNum = !isNaN(Number(char));
        const isDec = char === '.';
        if (!isNum) {
            return (
                <Characters
                    $decimal={isDec}
                    key={`dec-${i}`}
                    layout-id={`dec-${i}`}
                    initial={animateNumbers ? { y: letterHeight } : false}
                    animate={{ y: 0 }}
                    transition={transition}
                    $letterHeight={letterHeight}
                    $fontSize={fontSize}
                    $letterWidth={letterWidth}
                    $variant={variant}
                >
                    {isDec ? (
                        <Character $decimal $letterWidth={letterWidth} $fontSize={fontSize}>
                            {char}
                        </Character>
                    ) : (
                        <Character
                            $unit
                            key={`${i}-${char}`}
                            layout-id={`${i}-${char}`}
                            $letterWidth={letterWidth}
                            $fontSize={fontSize - 8}
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
                initial={animateNumbers ? { y: 0 } : false}
                animate={{ y: `-${y}px` }}
                $letterWidth={letterWidth}
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
        <Wrapper $alignment={XTMAlignment} $variant={variant}>
            <LayoutGroup id="char-spinner">
                <SpinnerWrapper style={{ height: letterHeight }} $variant={variant}>
                    <CharacterWrapper style={{ height: letterHeight * 10 }}>
                        <LayoutGroup id="characters">{charMarkup}</LayoutGroup>
                    </CharacterWrapper>
                </SpinnerWrapper>
                {/* // eslint-disable-next-line i18next/no-literal-string */}
                {value === '-' ? null : (
                    <XTMWrapper>
                        <Trans>tXTM</Trans>
                    </XTMWrapper>
                )}
            </LayoutGroup>
        </Wrapper>
    );
}

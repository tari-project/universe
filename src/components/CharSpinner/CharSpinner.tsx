import { Character, Characters, Wrapper } from './CharSpinner.styles.ts';
const NUMBER_HEIGHT = 52;
const NUMBER_WIDTH = 48;

export default function CharSpinner({ value }: { value: string }) {
    const charArray = value.split('').map((c) => c);
    const charMarkup = charArray.map((char, i) => {
        if (char === ',' || char === '.') {
            return (
                <Character
                    key={`dec-${i}`}
                    initial={{ y: NUMBER_HEIGHT }}
                    animate={{ y: 0 }}
                    transition={{ type: 'spring', bounce: 0.25, duration: 1.4 }}
                >
                    <span key={`dec-${i}`}>{char}</span>
                </Character>
            );
        }

        const y = parseInt(char) * NUMBER_HEIGHT;
        return (
            <Character
                key={`char-${i}-${char}`}
                initial={{ y: 0 }}
                animate={{ y: `-${y}px` }}
                transition={{ type: 'spring', bounce: 0.25, duration: 1.14, staggerChildren: 0.2, delayChildren: 0.1 }}
            >
                {[...Array(10)].reverse().map((_, index) => (
                    <span key={`number-scroll-${i}-${char}-${index}-num`}>{index}</span>
                ))}
            </Character>
        );
    });
    return (
        <Wrapper style={{ width: NUMBER_WIDTH * charArray.length }}>
            <Characters>{charMarkup}</Characters>
        </Wrapper>
    );
}

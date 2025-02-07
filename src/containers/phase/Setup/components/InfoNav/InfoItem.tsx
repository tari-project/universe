import { Container, Heading, Copy, AnimatedTextContainer, AnimatedSpan } from './InfoNav.styles';
import { memo, useMemo } from 'react';

interface InfoItemProps {
    title: string;
    text: string;
    step: number;
}

const InfoItem = memo(function InfoItem({ title, text, step }: InfoItemProps) {
    function getChars(text: string) {
        const splitIntoWords = (text: string) => {
            const regex = /(\p{Extended_Pictographic}|\S+|\s+)/gu;
            return text.match(regex) || [];
        };
        const words = splitIntoWords(text);
        return words.map((word: string, i: number) => (
            <AnimatedSpan key={`word:${i}-${word}`} $index={i}>
                {word}
            </AnimatedSpan>
        ));
    }
    const titleMarkup = useMemo(() => getChars(title), [title]);
    const bodyTextMarkup = useMemo(() => getChars(text), [text]);
    return (
        <Container initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
            <Heading $step={step}>
                <AnimatedTextContainer aria-hidden>{titleMarkup}</AnimatedTextContainer>
            </Heading>
            <Copy>
                <AnimatedTextContainer aria-hidden>{bodyTextMarkup}</AnimatedTextContainer>
            </Copy>
        </Container>
    );
});

export default InfoItem;

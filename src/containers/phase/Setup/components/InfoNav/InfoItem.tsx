import { Container, Heading, Copy, AnimatedTextContainer, AnimatedSpan } from './InfoNav.styles';
import { memo } from 'react';

interface InfoItemProps {
    title: string;
    text: string;
}

const splitIntoWords = (text: string) => {
    // This regex matches emojis, words, and preserves spaces
    const regex = /(\p{Extended_Pictographic}|\S+|\s+)/gu;
    return text.match(regex) || [];
};

const AnimatedLetters = memo(function AnimatedLetters({ text }: { text: string }) {
    const words = splitIntoWords(text);
    return (
        <AnimatedTextContainer aria-hidden>
            {words.map((word, i) => (
                <AnimatedSpan key={`word:${i}-${word}`} $index={i}>
                    {word}
                </AnimatedSpan>
            ))}
        </AnimatedTextContainer>
    );
});

export default function InfoItem({ title, text }: InfoItemProps) {
    return (
        <Container>
            <Heading>
                <AnimatedLetters text={title} />
            </Heading>
            <Copy>
                <AnimatedLetters text={text} />
            </Copy>
        </Container>
    );
}

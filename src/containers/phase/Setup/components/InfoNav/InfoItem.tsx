import { Container, Heading, Copy, AnimatedTextContainer, AnimatedSpan } from './InfoNav.styles';
import { memo } from 'react';

interface InfoItemProps {
    title: string;
    text: string;
    step: number;
}

const splitIntoWords = (text: string) => {
    const regex = /(\p{Extended_Pictographic}|\S+|\s+)/gu;
    return text.match(regex) || [];
};

const AnimatedLetters = memo(function AnimatedLetters({ text }: { text: string }) {
    const words = splitIntoWords(text);
    return (
        <AnimatedTextContainer aria-hidden>
            {words.map((word: string, i: number) => (
                <AnimatedSpan key={`word:${i}-${word}`} $index={i}>
                    {word}
                </AnimatedSpan>
            ))}
        </AnimatedTextContainer>
    );
});

export default function InfoItem({ title, text, step }: InfoItemProps) {
    return (
        <Container initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
            <Heading $step={step}>
                <AnimatedLetters text={title} />
            </Heading>
            <Copy>
                <AnimatedLetters text={text} />
            </Copy>
        </Container>
    );
}

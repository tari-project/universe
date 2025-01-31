import { Container, Heading, Copy, AnimatedTextContainer } from './InfoNav.styles';
import { m, Variants } from 'motion';

interface InfoItemProps {
    title: string;
    text: string;
}

const container: Variants = {
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.01,
            delayChildren: 0.005,
        },
    },
};

const child: Variants = {
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 120,
            damping: 10,
        },
    },
};

function AnimatedLetters({ text }: { text: string }) {
    const txtArr = Array.from(text);

    return (
        <AnimatedTextContainer aria-hidden variants={container} initial="hidden" animate="visible">
            {txtArr.map((char, i) => (
                <m.span key={`char:${i}-${char}`} variants={child}>
                    {char}
                </m.span>
            ))}
        </AnimatedTextContainer>
    );
}

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

import { Container, Heading, Copy, AnimatedTextContainer } from './InfoNav.styles';
import { m, Variants } from 'motion/react';
import { memo, useMemo } from 'react';

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

const InfoItem = memo(function InfoItem({ title, text }: InfoItemProps) {
    function getChars(text: string) {
        const txtArr = Array.from(text);
        return txtArr.map((char, i) => (
            <m.span key={`char:${i}-${char}`} variants={child}>
                {char}
            </m.span>
        ));
    }
    const titleMarkup = useMemo(() => getChars(title), [title]);
    const bodyTextMarkup = useMemo(() => getChars(text), [text]);
    return (
        <Container>
            <Heading>
                <AnimatedTextContainer aria-hidden variants={container} initial="hidden" animate="visible">
                    {titleMarkup}
                </AnimatedTextContainer>
            </Heading>
            <Copy>
                <AnimatedTextContainer aria-hidden variants={container} initial="hidden" animate="visible">
                    {bodyTextMarkup}
                </AnimatedTextContainer>
            </Copy>
        </Container>
    );
});

export default InfoItem;

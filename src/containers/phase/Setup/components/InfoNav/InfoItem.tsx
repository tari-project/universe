import { useTranslation } from 'react-i18next';
import { Container, Heading, Copy, AnimatedTextContainer } from './InfoNav.styles';
import { m, Variants } from 'framer-motion';
const emojis = {
    'step-1': ['💜', '🐢'],
    'step-6': ['🙏'],
};

interface InfoItemProps {
    step?: number;
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

export default function InfoItem({ step = 1 }: InfoItemProps) {
    const { t } = useTranslation('info');
    const stepEmojis = emojis[`step-${step}`];

    const emojiParams = {};
    if (stepEmojis?.length) {
        stepEmojis.forEach((e: string, i: number) => (emojiParams[`emoji${i > 0 ? i : ''}`] = e));
    }

    const headingText = t(`heading.step-${step}`);
    const copyText = t(`content.step-${step}`, { ...emojiParams });
    return (
        <Container>
            <Heading>
                <AnimatedLetters text={headingText} />
            </Heading>
            <Copy>
                <AnimatedLetters text={copyText} />
            </Copy>
        </Container>
    );
}

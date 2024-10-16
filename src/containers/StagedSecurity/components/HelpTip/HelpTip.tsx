import { AnimatePresence } from 'framer-motion';
import { Text, TextButton, Title, Wrapper } from './styles';

interface Props {
    title: string;
    text: string;
    show: boolean;
    setShow: (show: boolean) => void;
}

export default function HelpTip({ title, text, show, setShow }: Props) {
    return (
        <AnimatePresence>
            {show && (
                <Wrapper initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                    <Title>{title}</Title>
                    <Text>{text}</Text>
                    <TextButton onClick={() => setShow(false)}>Got it</TextButton>
                </Wrapper>
            )}
        </AnimatePresence>
    );
}

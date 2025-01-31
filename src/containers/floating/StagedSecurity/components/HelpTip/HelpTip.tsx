import { AnimatePresence } from 'motion/react';
import { Text, TextButton, Title, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';

interface Props {
    title: string;
    text: string;
    show: boolean;
    setShow: (show: boolean) => void;
}

export default function HelpTip({ title, text, show, setShow }: Props) {
    const { t } = useTranslation(['staged-security'], { useSuspense: false });

    return (
        <AnimatePresence>
            {show && (
                <Wrapper initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                    <Title>{title}</Title>
                    <Text>{text}</Text>
                    <TextButton onClick={() => setShow(false)}>{t('common.got-it')}</TextButton>
                </Wrapper>
            )}
        </AnimatePresence>
    );
}

import React, { useState, useEffect } from 'react';
import { ClipboardIcon, ClipboardText, Container, ContentContainer, ErrorText, TextContainer, Title } from './styles';
import { useTranslation } from 'react-i18next';

export const ClipboardViewer: React.FC = () => {
    const [clipboardText, setClipboardText] = useState<string>('');
    const [error, setError] = useState<string>('');
    const { t } = useTranslation('exchange');
    useEffect(() => {
        const readClipboard = async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.readText) {
                    const text = await navigator.clipboard.readText();
                    setClipboardText(text);
                    setError('');
                } else {
                    setError('Clipboard API not supported');
                }
            } catch (err) {
                setError('Unable to read clipboard');
            }
        };

        readClipboard();

        // Poll clipboard every 1 second to check for changes
        const interval = setInterval(readClipboard, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Container>
            <ClipboardIcon src="/assets/img/copy-clipboard.svg" alt="Clipboard" />
            <ContentContainer>
                <Title>{t('paste-from-clipboard')}</Title>
                <TextContainer>
                    {error ? (
                        <ErrorText>{error}</ErrorText>
                    ) : (
                        <ClipboardText>{clipboardText || 'Clipboard is empty'}</ClipboardText>
                    )}
                </TextContainer>
            </ContentContainer>
        </Container>
    );
};

export default ClipboardViewer;

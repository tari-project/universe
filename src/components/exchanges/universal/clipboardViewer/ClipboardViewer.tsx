import React, { useState, useEffect } from 'react';
import { ClipboardIcon, ClipboardText, Container, ContentContainer, ErrorText, TextContainer, Title } from './styles';
import { useTranslation } from 'react-i18next';
import { readText } from '@tauri-apps/plugin-clipboard-manager';

export interface ClipboardViewerProps {
    handlePaste: (text: string) => void;
}

export const ClipboardViewer: React.FC<ClipboardViewerProps> = ({ handlePaste }) => {
    const [clipboardText, setClipboardText] = useState<string>('');
    const [error, setError] = useState<string>('');
    const { t } = useTranslation('exchange');
    useEffect(() => {
        const readClipboard = async () => {
            try {
                const text = await readText();
                if (text) {
                    setClipboardText(text);
                    setError('');
                }
            } catch (err) {
                setError('Unable to read clipboard: ' + err);
            }
        };

        readClipboard();

        // Poll clipboard every 1 second to check for changes
        const interval = setInterval(readClipboard, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Container>
            <ClipboardIcon
                src="/assets/img/copy-clipboard.svg"
                alt="Clipboard"
                onClick={() => handlePaste(clipboardText)}
            />
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

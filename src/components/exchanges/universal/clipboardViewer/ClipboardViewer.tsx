import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardIcon, ClipboardText, Container, ContentContainer, TextContainer, Title } from './styles';
import { useTranslation } from 'react-i18next';
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import { invoke } from '@tauri-apps/api/core';

export interface ClipboardViewerProps {
    handlePaste: (text: string) => void;
}

export const ClipboardViewer: React.FC<ClipboardViewerProps> = ({ handlePaste }) => {
    const [clipboardText, setClipboardText] = useState<string | undefined>();
    const { t } = useTranslation('exchange');

    const validateAddress = useCallback(async (value: string) => {
        try {
            await invoke('verify_address_for_send', { address: value });
            return true;
        } catch (_) {
            return false;
        }
    }, []);

    useEffect(() => {
        const readClipboard = async () => {
            try {
                const text = await readText();
                if (text) {
                    const isValidAddress = await validateAddress(text);
                    setClipboardText(isValidAddress ? text : undefined);
                }
            } catch (err) {
                console.error('Unable to read clipboard: ' + err);
                setClipboardText(undefined);
            }
        };

        void readClipboard();

        // Poll clipboard every 1 second to check for changes
        const interval = setInterval(readClipboard, 1000);

        return () => clearInterval(interval);
    }, [validateAddress]);

    return clipboardText?.length ? (
        <Container>
            <ClipboardIcon
                src="/assets/img/copy-clipboard.svg"
                alt="Clipboard"
                onClick={() => handlePaste(clipboardText)}
            />
            <ContentContainer>
                <Title>{t('paste-from-clipboard')}</Title>
                <TextContainer>
                    <ClipboardText>{clipboardText}</ClipboardText>
                </TextContainer>
            </ContentContainer>
        </Container>
    ) : null;
};

import React, { useState, useEffect } from 'react';
import { ClipboardIcon, ClipboardText, Container, ContentContainer, TextContainer, Title } from './styles';
import { useTranslation } from 'react-i18next';
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import { useValidateTariAddress } from '@app/hooks/wallet/useValidate.ts';

export interface ClipboardViewerProps {
    handlePaste: (text: string) => void;
}

export const ClipboardViewer: React.FC<ClipboardViewerProps> = ({ handlePaste }) => {
    const [clipboardText, setClipboardText] = useState<string | undefined>();
    const { t } = useTranslation('exchange');

    const { validateAddress } = useValidateTariAddress();

    useEffect(() => {
        let cancelled = false;
        let inFlight = false;
        let lastCheckedText: string | undefined;

        const readClipboard = async () => {
            if (inFlight || cancelled) return;
            inFlight = true;
            try {
                const text = await readText();
                if (cancelled) return;
                if (!text) {
                    if (lastCheckedText !== undefined) {
                        lastCheckedText = undefined;
                        setClipboardText(undefined);
                    }
                    return;
                }
                if (text === lastCheckedText) {
                    return;
                }
                lastCheckedText = text;
                const isValidAddress = await validateAddress(text);
                if (!cancelled) {
                    setClipboardText(isValidAddress ? text : undefined);
                }
            } catch (err) {
                console.error('Unable to read clipboard: ' + err);
                if (!cancelled) {
                    lastCheckedText = undefined;
                    setClipboardText(undefined);
                }
            } finally {
                inFlight = false;
            }
        };

        void readClipboard();

        // Poll clipboard every 1 second to check for changes
        const interval = setInterval(() => {
            void readClipboard();
        }, 1000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
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

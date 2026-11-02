import React, { useState, useEffect, useRef } from 'react';
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
    const inFlightRef = useRef(false);
    const lastTextRef = useRef<string | undefined>(undefined);

    const { validateAddress } = useValidateTariAddress();

    useEffect(() => {
        let cancelled = false;

        const readClipboard = async () => {
            if (inFlightRef.current || cancelled) return;
            inFlightRef.current = true;
            try {
                const text = await readText();
                if (cancelled || text === lastTextRef.current) return;
                lastTextRef.current = text;
                if (text) {
                    const isValidAddress = await validateAddress(text);
                    if (!cancelled) {
                        setClipboardText(isValidAddress ? text : undefined);
                    }
                } else if (!cancelled) {
                    setClipboardText(undefined);
                }
            } catch (err) {
                console.error('Unable to read clipboard: ' + err);
                if (!cancelled) {
                    setClipboardText(undefined);
                }
            } finally {
                inFlightRef.current = false;
            }
        };

        void readClipboard();

        // Poll clipboard every 1 second to check for changes
        const interval = setInterval(readClipboard, 1000);

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

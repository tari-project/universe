import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { BlackButton } from '../../styles';
import {
    ButtonWrapper,
    CodeWrapper,
    Divider,
    InputField,
    InputLabel,
    InputWrapper,
    QRCodeWrapper,
    QRContentWrapper,
    Text,
    TextWrapper,
    Title,
    VisibleToggle,
    WarningText,
    Wrapper,
} from './styles';
import { useCallback, useEffect, useRef, useState } from 'react';
import ShowIcon from '../../icons/ShowIcon';
import HideIcon from '../../icons/HideIcon';
import { useTranslation } from 'react-i18next';
import { QRCode } from 'react-qrcode-logo';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore';

interface Props {
    onDoneClick: () => void;
}

export default function QRCodeSection({ onDoneClick }: Props) {
    const { t } = useTranslation(['paper-wallet'], { useSuspense: false });
    const { qrCodeValue, identificationCode } = usePaperWalletStore();
    const selfClosingTimeoutRef = useRef<NodeJS.Timeout>(undefined);

    const [showCode, setShowCode] = useState(false);
    const [copied, setCopied] = useState(false);

    const resetSelfClosingTimeout = useCallback(() => {
        if (selfClosingTimeoutRef.current) {
            clearTimeout(selfClosingTimeoutRef.current);
        }
        selfClosingTimeoutRef.current = setTimeout(() => onDoneClick(), 5 * 60 * 1000);
    }, [onDoneClick]);

    const handleVisibleToggleClick = () => {
        setShowCode((prev) => !prev);
        resetSelfClosingTimeout();
    };

    const handleCopyClick = () => {
        writeText(identificationCode).then(() => setCopied(true));
        resetSelfClosingTimeout();
    };

    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        }
    }, [copied]);

    useEffect(() => {
        resetSelfClosingTimeout();

        return () => {
            if (selfClosingTimeoutRef.current) {
                clearTimeout(selfClosingTimeoutRef.current);
            }
        };
    }, [resetSelfClosingTimeout]);

    const shrinkFont = identificationCode.length > 30;
    return (
        <Wrapper>
            <CodeWrapper>
                <QRCodeWrapper>
                    <QRCode
                        size={190}
                        style={{ borderRadius: 15 }}
                        value={qrCodeValue}
                        quietZone={12}
                        eyeRadius={4}
                        ecLevel="M"
                    />
                </QRCodeWrapper>

                <QRContentWrapper>
                    <TextWrapper>
                        <WarningText>❗ {t('qrcode.warning')}</WarningText>
                        <Title>{t('qrcode.title')}</Title>
                        <Text>{t('qrcode.text')}</Text>
                    </TextWrapper>
                    <InputWrapper>
                        <VisibleToggle onClick={handleVisibleToggleClick}>
                            {!showCode ? <ShowIcon /> : <HideIcon />}
                        </VisibleToggle>
                        <InputLabel>{copied ? t('qrcode.copied') : t('qrcode.inputLabel')}</InputLabel>
                        <InputField
                            type={showCode ? 'text' : 'password'}
                            value={identificationCode}
                            $shrinkFont={shrinkFont}
                            readOnly
                            onClick={handleCopyClick}
                        />
                    </InputWrapper>
                </QRContentWrapper>
            </CodeWrapper>

            <ButtonWrapper>
                <Divider />
                <BlackButton onClick={onDoneClick}>
                    <span>{t('qrcode.blackButton')}</span>
                </BlackButton>
            </ButtonWrapper>
        </Wrapper>
    );
}

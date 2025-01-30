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
    Title,
    VisibleToggle,
    WarningText,
    Wrapper,
} from './styles';
import { useEffect, useState } from 'react';
import ShowIcon from '../../icons/ShowIcon';
import HideIcon from '../../icons/HideIcon';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore';

interface Props {
    onDoneClick: () => void;
}

export default function QRCodeSection({ onDoneClick }: Props) {
    const { t } = useTranslation(['paper-wallet'], { useSuspense: false });
    const { qrCodeValue, identificationCode } = usePaperWalletStore();

    const [showCode, setShowCode] = useState(false);
    const [copied, setCopied] = useState(false);

    // const handleTextButtonClick = () => {
    //     // TODO add help link
    // };

    const handleVisibleToggleClick = () => {
        setShowCode((prev) => !prev);
    };

    const handleCopyClick = () => {
        writeText(identificationCode).then(() => setCopied(true));
    };

    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        }
    }, [copied]);

    return (
        <Wrapper>
            <CodeWrapper>
                <QRCodeWrapper>
                    <QRCode
                        size={200}
                        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                        value={qrCodeValue}
                    />
                </QRCodeWrapper>

                <QRContentWrapper>
                    <WarningText>❗ {t('qrcode.warning')}</WarningText>

                    <Title>{t('qrcode.title')}</Title>

                    <Text>{t('qrcode.text')}</Text>

                    <InputWrapper>
                        <InputLabel>{copied ? t('qrcode.copied') : t('qrcode.inputLabel')}</InputLabel>
                        <InputField
                            type={showCode ? 'text' : 'password'}
                            value={identificationCode}
                            readOnly
                            onClick={handleCopyClick}
                        />
                        <VisibleToggle onClick={handleVisibleToggleClick}>
                            {!showCode ? <ShowIcon /> : <HideIcon />}
                        </VisibleToggle>
                    </InputWrapper>
                </QRContentWrapper>
            </CodeWrapper>

            <Divider />

            <ButtonWrapper>
                <BlackButton onClick={onDoneClick}>
                    <span>{t('qrcode.blackButton')}</span>
                </BlackButton>

                {
                    // <TextButton onClick={handleTextButtonClick}>{t('qrcode.textButton')}</TextButton>
                }
            </ButtonWrapper>
        </Wrapper>
    );
}

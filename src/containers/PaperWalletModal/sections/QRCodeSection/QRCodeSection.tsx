import { BlackButton, TextButton } from '../../styles';
import {
    ButtonWrapper,
    CodeWrapper,
    Divider,
    InputField,
    InputLabel,
    InputWrapper,
    QRCodeImage,
    QRCodeWrapper,
    QRContentWrapper,
    Text,
    Title,
    VisibleToggle,
    WarningText,
    Wrapper,
} from './styles';
import qrMainImage from '../../images/qr-main.png';
import { useEffect, useState } from 'react';
import ShowIcon from '../../icons/ShowIcon';
import HideIcon from '../../icons/HideIcon';
import { useTranslation } from 'react-i18next';

interface Props {
    onDoneClick: () => void;
}

export default function QRCodeSection({ onDoneClick }: Props) {
    const { t } = useTranslation(['paper-wallet'], { useSuspense: false });

    const [showCode, setShowCode] = useState(false);
    const [copied, setCopied] = useState(false);

    const identificationCode = '123456';

    const handleTextButtonClick = () => {
        console.log('Help');
    };

    const handleVisibleToggleClick = () => {
        setShowCode((prev) => !prev);
    };

    const handleCopyClick = () => {
        navigator.clipboard.writeText(identificationCode);
        setCopied(true);
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
                    <QRCodeImage src={qrMainImage} alt="" />
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

                <TextButton onClick={handleTextButtonClick}>{t('qrcode.textButton')}</TextButton>
            </ButtonWrapper>
        </Wrapper>
    );
}

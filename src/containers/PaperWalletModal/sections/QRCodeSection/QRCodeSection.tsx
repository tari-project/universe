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
import { useCallback, useEffect, useState } from 'react';
import ShowIcon from '../../icons/ShowIcon';
import HideIcon from '../../icons/HideIcon';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import QRCode from 'react-qr-code';

interface Props {
    onDoneClick: () => void;
}

export default function QRCodeSection({ onDoneClick }: Props) {
    const { t } = useTranslation(['paper-wallet'], { useSuspense: false });

    const [showCode, setShowCode] = useState(false);
    const [copied, setCopied] = useState(false);

    const [qrCodeValue, setValue] = useState('');
    const [identificationCode, setIdentificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        const r = await invoke('get_paper_wallet_details');

        if (r) {
            const url = r.qr_link;
            const password = r.password;

            setValue(url);
            setIdentificationCode(password);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTextButtonClick = () => {
        // TODO add help link
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

    if (isLoading)
        return (
            <Wrapper>
                <CircularProgress />
            </Wrapper>
        );

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

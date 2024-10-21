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

interface Props {
    onDoneClick: () => void;
}

export default function QRCodeSection({ onDoneClick }: Props) {
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
                    <WarningText>❗ Do not share this QR code</WarningText>

                    <Title>Import to Tari Aurora</Title>

                    <Text>
                        Scan the QR code within the Tari Aurora app to import your Tari Universe wallet. Use the 1-time
                        code below to confirm your identity, then, follow the steps within the app.
                    </Text>

                    <InputWrapper>
                        <InputLabel>{copied ? 'Copied!' : 'Identification Code'}</InputLabel>
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
                    <span>Done</span>
                </BlackButton>

                <TextButton onClick={handleTextButtonClick}>I need help</TextButton>
            </ButtonWrapper>
        </Wrapper>
    );
}

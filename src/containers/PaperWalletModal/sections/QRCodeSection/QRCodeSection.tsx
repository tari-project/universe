import { BlackButton, TextButton } from '../../styles';
import { ButtonWrapper, CodeWrapper, Divider, QRCodeImage, QRCodeWrapper, Wrapper } from './styles';
import qrMainImage from '../../images/qr-main.png';

export default function QRCodeSection() {
    const handleBlackButtonClick = () => {
        console.log('Done');
    };

    const handleTextButtonClick = () => {
        console.log('Help');
    };

    return (
        <Wrapper>
            <CodeWrapper>
                <QRCodeWrapper>
                    <QRCodeImage src={qrMainImage} alt="" />
                </QRCodeWrapper>
            </CodeWrapper>

            <Divider />

            <ButtonWrapper>
                <BlackButton onClick={handleBlackButtonClick}>
                    <span>Done</span>
                </BlackButton>

                <TextButton onClick={handleTextButtonClick}>I need help</TextButton>
            </ButtonWrapper>
        </Wrapper>
    );
}

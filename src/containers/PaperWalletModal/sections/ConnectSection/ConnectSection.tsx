import { ContentWrapper, HeroImage, StoreWrapper, Text, Title, Wrapper } from './styles';
import paperWalletImage from '../../images/paper-wallet-phone.png';
import AppleStoreIcon from '../../icons/AppleStoreIcon';
import GoogleStoreIcon from '../../icons/GoogleStoreIcon';
import { BlackButton, TextButton } from '../../styles';
import { PaperWalletModalSectionType } from '../../PaperWalletModal';
import QRTooltip from './QRTooltip/QRTooltip';
import qrTooltipImage from '../../images/qr-tooltip.png';

interface Props {
    setSection: (section: PaperWalletModalSectionType) => void;
}

export default function ConnectSection({ setSection }: Props) {
    const handleBlackButtonClick = () => {
        setSection('QRCode');
    };

    const handleTextButtonClick = () => {
        console.log('Learn more about Tari Aurora');
    };

    return (
        <Wrapper>
            <HeroImage src={paperWalletImage} alt="" />

            <ContentWrapper>
                <Title>Connect your Tari Universe wallet to your phone</Title>

                <Text>
                    Download Tari Aurora and keep track of your XTM anywhere. Get it now on the App Store or Google Play
                    Store.
                </Text>

                <StoreWrapper>
                    <QRTooltip trigger={<AppleStoreIcon />} text={`Scan QR Code`} codeImage={qrTooltipImage} />

                    <QRTooltip trigger={<GoogleStoreIcon />} text={`Scan QR Code`} codeImage={qrTooltipImage} />
                </StoreWrapper>

                <BlackButton onClick={handleBlackButtonClick}>
                    <span>I have the app</span>
                </BlackButton>

                <TextButton onClick={handleTextButtonClick}>Learn more about Tari Aurora</TextButton>
            </ContentWrapper>
        </Wrapper>
    );
}

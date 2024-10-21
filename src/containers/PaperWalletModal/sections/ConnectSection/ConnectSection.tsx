import { ContentWrapper, HeroImage, StoreWrapper, Text, Title, Wrapper } from './styles';
import paperWalletImage from '../../images/paper-wallet-phone.png';
import AppleStoreIcon from '../../icons/AppleStoreIcon';
import GoogleStoreIcon from '../../icons/GoogleStoreIcon';
import { BlackButton, TextButton } from '../../styles';
import { PaperWalletModalSectionType } from '../../PaperWalletModal';
import QRTooltip from './QRTooltip/QRTooltip';
import qrTooltipImage from '../../images/qr-tooltip.png';
import { useTranslation } from 'react-i18next';

interface Props {
    setSection: (section: PaperWalletModalSectionType) => void;
}

export default function ConnectSection({ setSection }: Props) {
    const { t } = useTranslation(['paper-wallet'], { useSuspense: false });

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
                <Title>{t('connect.title')}</Title>

                <Text>{t('connect.text')}</Text>

                <StoreWrapper>
                    <QRTooltip trigger={<AppleStoreIcon />} text={t('connect.scan')} codeImage={qrTooltipImage} />

                    <QRTooltip trigger={<GoogleStoreIcon />} text={t('connect.scan')} codeImage={qrTooltipImage} />
                </StoreWrapper>

                <BlackButton onClick={handleBlackButtonClick}>
                    <span>{t('connect.blackButton')}</span>
                </BlackButton>

                <TextButton onClick={handleTextButtonClick}>{t('connect.textButton')}</TextButton>
            </ContentWrapper>
        </Wrapper>
    );
}

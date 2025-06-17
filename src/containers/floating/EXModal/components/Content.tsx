import GradientText from '@app/components/elements/gradientText/GradientText.tsx';
import { Connect } from '@app/components/exchanges/connect/Connect.tsx';
import { BodyCopy, Container, ContentContainer, Heading, LogoContainer, LogoImg } from './content.styles.ts';
import { ExchangeBranding } from '@app/types/exchange.ts';
import { useTheme } from 'styled-components';

interface ContentProps {
    data: ExchangeBranding;
}
export default function Content({ data }: ContentProps) {
    const theme = useTheme();
    const darkMode = theme.mode === 'dark';
    const primaryColor = data.primary_colour || '#FFFFFF';
    const secondaryColor = darkMode ? primaryColor : data.secondary_colour || '#C9EB00';
    return (
        <Container>
            <LogoContainer>
                <LogoImg src={data.logo_img_url} alt={`${data.name} Logo`} />
            </LogoContainer>
            <ContentContainer>
                <GradientText colors={[secondaryColor, primaryColor, secondaryColor]}>
                    <Heading>{data.campaign_title}</Heading>
                </GradientText>
                <BodyCopy>
                    {`Earn `} <strong>{`${data.reward_percentage}% bonus XTM`} </strong>
                    {`when you mine to your ${data.name} wallet.`}
                </BodyCopy>
            </ContentContainer>
            <Connect />
        </Container>
    );
}

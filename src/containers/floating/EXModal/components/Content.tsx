import { ExchangeContent } from '@app/types/exchange.ts';
import GradientText from '@app/components/elements/gradientText/GradientText.tsx';
import { Connect } from '@app/components/exchanges/connect/Connect.tsx';
import { BodyCopy, Container, ContentContainer, Heading, LogoContainer, LogoImg } from './content.styles.ts';

interface ContentProps {
    data: ExchangeContent;
}
export default function Content({ data }: ContentProps) {
    return (
        <Container>
            <LogoContainer>
                <LogoImg src={data.logo_img_url} alt={`${data.name} Logo`} />
                {`TXC LOGO`}
            </LogoContainer>
            <ContentContainer>
                <GradientText colors={[data.secondary_colour, data.primary_colour, data.secondary_colour]}>
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

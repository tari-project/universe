import { ExchangeContent } from '@app/types/exchange.ts';
import GradientText from '@app/components/elements/gradientText/GradientText.tsx';
import { Connect } from '@app/components/exchanges/connect/Connect.tsx';
import { Container, ContentContainer, Heading, LogoContainer, LogoImg } from './content.styles.ts';

interface ContentProps {
    data: ExchangeContent;
}
export default function Content({ data }: ContentProps) {
    return (
        <Container>
            <LogoContainer>
                <LogoImg src={data.logo_img_url} alt={data.name} />
                {`TariExchange LOGO`}
            </LogoContainer>
            <ContentContainer>
                <GradientText colors={[data.secondary_colour, data.primary_colour, data.secondary_colour]}>
                    <Heading>{data.campaign_title}</Heading>
                </GradientText>
                <p>{data.campaign_description}</p>
            </ContentContainer>
            <Connect />
        </Container>
    );
}

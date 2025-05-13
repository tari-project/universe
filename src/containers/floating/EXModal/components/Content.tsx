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
                <LogoImg src={data.exchange_logo_img} alt={data.exchange_name} />
                {`TariExchange LOGO`}
            </LogoContainer>
            <ContentContainer>
                <GradientText colors={[data.secondary_col, data.primary_col, data.secondary_col]}>
                    <Heading>{data.exchange_campaign_description}</Heading>
                </GradientText>
                <p>{data.exchange_campaign_description_extra}</p>
            </ContentContainer>
            <Connect />
        </Container>
    );
}

import { Button } from '@app/components/elements/buttons/Button.tsx';
import { BodyTextWrapper, CTAContent, CTASection, Icon, Title, Wrapper } from './styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import turboIcon from '@app/assets/icons/emoji/tornado.png';

interface EcoAlertProps {
    onAllClick: () => void;
}
export default function EcoAlert({ onAllClick }: EcoAlertProps) {
    return (
        <Wrapper>
            <Title>{`Not getting enough rewards?`}</Title>
            <BodyTextWrapper>
                <Typography variant="p">{`Eco mode only uses 1% of available resources.`}</Typography>
                <Typography variant="p">{`Try turning the power mode up.`}</Typography>
            </BodyTextWrapper>
            <CTASection>
                <Button size="xs" fluid onClick={onAllClick}>{`See all modes`}</Button>
                <Button size="xs" backgroundColor="teal" fluid>
                    <CTAContent>
                        {`Use Turbo️`}
                        <Icon src={turboIcon} />
                    </CTAContent>
                </Button>
            </CTASection>
        </Wrapper>
    );
}

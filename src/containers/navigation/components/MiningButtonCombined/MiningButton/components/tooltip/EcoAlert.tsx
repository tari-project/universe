import { Button } from '@app/components/elements/buttons/Button.tsx';
import { BodyTextWrapper, CTAContent, CTASection, Icon, Title, Wrapper } from './styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import turboIcon from '@app/assets/icons/emoji/tornado.png';

interface EcoAlertProps {
    onAllClick: () => void;
    onTurboClick: () => void;
}
export default function EcoAlert({ onAllClick, onTurboClick }: EcoAlertProps) {
    return (
        <Wrapper>
            <Title>{`Not getting enough rewards?`}</Title>
            <BodyTextWrapper>
                <Typography variant="p">{`Eco mode only uses a low percentage of system resources.`}</Typography>
                <Typography variant="p">{`Try turning the power mode up.`}</Typography>
            </BodyTextWrapper>
            <CTASection>
                <Button size="xs" fluid onClick={onAllClick}>
                    <CTAContent>
                        <Typography>{`See all modes`}</Typography>
                    </CTAContent>
                </Button>
                <Button size="xs" backgroundColor="teal" fluid onClick={onTurboClick}>
                    <CTAContent>
                        <Typography>{`Use Turbo️`}</Typography>
                        <Icon src={turboIcon} />
                    </CTAContent>
                </Button>
            </CTASection>
        </Wrapper>
    );
}

import { Button } from '@app/components/elements/buttons/Button.tsx';
import { BodyTextWrapper, CTAContent, CTASection, Icon, Title, Wrapper } from './styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import turboIcon from '@app/assets/icons/emoji/tornado.png';
import { useAirdropStore } from '@app/store';
import { FEATURE_FLAGS } from '@app/store/consts.ts';

export default function EcoAlert() {
    const ff = useAirdropStore((s) => s.features);
    const canShow = ff?.includes(FEATURE_FLAGS.FE_UI_ECO_ALERT);
    if (!canShow) return null;
    return (
        <Wrapper>
            <Title>{`Not getting enough rewards?`}</Title>
            <BodyTextWrapper>
                <Typography variant="p">{`Eco mode only uses 1% of available resources.`}</Typography>
                <Typography variant="p">{`Try turning the power mode up.`}</Typography>
            </BodyTextWrapper>
            <CTASection>
                <Button size="xs">{`See all modes`}</Button>
                <Button size="xs" backgroundColor="teal">
                    <CTAContent>
                        {`Use Turbo️`}
                        <Icon src={turboIcon} />
                    </CTAContent>
                </Button>
            </CTASection>
        </Wrapper>
    );
}

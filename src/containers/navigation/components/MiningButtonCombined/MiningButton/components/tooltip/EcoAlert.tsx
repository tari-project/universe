import { Button } from '@app/components/elements/buttons/Button.tsx';
import { BodyTextWrapper, CTAContent, CTASection, Icon, Title, Wrapper } from './styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import turboIcon from '@app/assets/icons/emoji/tornado.png';
import { useTranslation } from 'react-i18next';

interface EcoAlertProps {
    onAllClick: () => void;
    onTurboClick: () => void;
}
export default function EcoAlert({ onAllClick, onTurboClick }: EcoAlertProps) {
    const { t } = useTranslation('mining-view');
    return (
        <Wrapper>
            <Title>{t('modes.eco.alert_title')}</Title>
            <BodyTextWrapper>
                <Typography variant="p">{t('modes.eco.alert_text')}</Typography>
                <Typography variant="p">{t('modes.eco.alert_text_extra')}</Typography>
            </BodyTextWrapper>
            <CTASection>
                <Button size="xs" fluid onClick={onAllClick}>
                    <CTAContent>
                        <Typography>{t('modes.eco.alert_cta-all')}</Typography>
                    </CTAContent>
                </Button>
                <Button size="xs" backgroundColor="teal" fluid onClick={onTurboClick}>
                    <CTAContent>
                        <Typography>{t('modes.eco.alert_cta-turbo')}</Typography>
                        <Icon src={turboIcon} />
                    </CTAContent>
                </Button>
            </CTASection>
        </Wrapper>
    );
}

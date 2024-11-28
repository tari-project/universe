import {
    Wrapper,
    VerticalText,
    DividerLineLeft,
    DividerLineRight,
    TimerColumn,
    NumberGroup,
    Number,
    Label,
} from './styles';
import { useTranslation } from 'react-i18next';

export default function Timer() {
    const { t } = useTranslation('sos', { useSuspense: false });

    return (
        <Wrapper>
            <VerticalText>
                {t('widget.timer.gettingClose')}
                <DividerLineLeft />
                <DividerLineRight />
            </VerticalText>

            <TimerColumn>
                <NumberGroup>
                    <Number>87</Number>
                    <Label>{t('widget.timer.days')}</Label>
                </NumberGroup>

                <NumberGroup>
                    <Number>12</Number>
                    <Label>{t('widget.timer.hours')}</Label>
                </NumberGroup>
            </TimerColumn>
        </Wrapper>
    );
}

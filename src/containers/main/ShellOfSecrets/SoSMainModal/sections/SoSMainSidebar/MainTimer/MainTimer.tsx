import { useTranslation } from 'react-i18next';
import {
    Label,
    LineBottom,
    LineLeft,
    LineRight,
    Number,
    NumberGroup,
    SectionLabel,
    TimerColumn,
    TopBar,
    Wrapper,
} from './styles';

export default function MainTimer() {
    const { t } = useTranslation('sos', { useSuspense: false });

    return (
        <Wrapper>
            <TopBar>
                <LineLeft />
                <SectionLabel>{t('mainTimer.title')}</SectionLabel>
                <LineRight />
            </TopBar>

            <TimerColumn>
                <NumberGroup>
                    <Number>87</Number>
                    <Label>{t('mainTimer.days')}</Label>
                </NumberGroup>

                <NumberGroup>
                    <Number>12</Number>
                    <Label>{t('mainTimer.hours')}</Label>
                </NumberGroup>

                <NumberGroup>
                    <Number>42</Number>
                    <Label>{t('mainTimer.minutes')}</Label>
                </NumberGroup>

                <NumberGroup
                    style={{
                        opacity: 0.5,
                    }}
                >
                    <Number>18</Number>
                    <Label>{t('mainTimer.seconds')}</Label>
                </NumberGroup>

                <LineBottom />
            </TimerColumn>
        </Wrapper>
    );
}

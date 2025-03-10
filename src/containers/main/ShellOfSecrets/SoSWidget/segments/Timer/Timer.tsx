import { getSOSTimeRemaining } from '@app/store/useShellOfSecretsStore';
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
import { memo, useEffect, useState } from 'react';

const Timer = memo(function Timer() {
    const { t } = useTranslation('sos', { useSuspense: false });
    const [reminingTime, setRemainingTime] = useState({ days: 0, hours: 0, totalRemainingMs: 0 });

    useEffect(() => {
        const intervalId = setInterval(() => {
            setRemainingTime(getSOSTimeRemaining());
        }, 5000);
        return () => {
            clearInterval(intervalId);
        };
    }, []);

    return (
        <Wrapper>
            <VerticalText>
                {t('widget.timer.gettingClose')}
                <DividerLineLeft />
                <DividerLineRight />
            </VerticalText>

            <TimerColumn>
                <NumberGroup>
                    <Number>{reminingTime.days}</Number>
                    <Label>{t('widget.timer.days')}</Label>
                </NumberGroup>

                <NumberGroup>
                    <Number>{reminingTime.hours}</Number>
                    <Label>{t('widget.timer.hours')}</Label>
                </NumberGroup>
            </TimerColumn>
        </Wrapper>
    );
});

export default Timer;

import { useShellOfSecretsStore } from '@app/store/useShellOfSecretsStore';
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
import { useEffect, useState } from 'react';

export default function Timer() {
    const { t } = useTranslation('sos', { useSuspense: false });
    const { getTimeRemaining } = useShellOfSecretsStore();
    const [reminingTime, setRemainingTime] = useState({ days: 0, hours: 0, totalRemainingMs: 0 });

    useEffect(() => {
        const intervalId = setInterval(() => {
            setRemainingTime(getTimeRemaining());
        }, 5000);
        return () => {
            clearInterval(intervalId);
        };
    }, [getTimeRemaining]);

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
}

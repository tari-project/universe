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
import NumberFlow from '@number-flow/react';

export default function Timer() {
    const { t } = useTranslation('sos', { useSuspense: false });
    const getTimeRemaining = useShellOfSecretsStore((s) => s.getTimeRemaining);
    const [reminingTime, setRemainingTime] = useState({ days: 0, hours: 0, totalRemainingMs: 0 });

    useEffect(() => {
        const intervalId = setInterval(() => {
            setRemainingTime(getTimeRemaining());
        }, 5000);
        return () => {
            clearInterval(intervalId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    <Number>
                        <NumberFlow
                            value={reminingTime.days}
                            willChange={true}
                            continuous={true}
                            trend={-1}
                            format={{
                                style: 'decimal',
                                minimumIntegerDigits: 2,
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            }}
                        />
                    </Number>
                    <Label>{t('widget.timer.days')}</Label>
                </NumberGroup>

                <NumberGroup>
                    <Number>
                        <NumberFlow
                            value={reminingTime.hours}
                            willChange={true}
                            continuous={true}
                            trend={-1}
                            format={{
                                style: 'decimal',
                                minimumIntegerDigits: 2,
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            }}
                        />
                    </Number>
                    <Label>{t('widget.timer.hours')}</Label>
                </NumberGroup>
            </TimerColumn>
        </Wrapper>
    );
}

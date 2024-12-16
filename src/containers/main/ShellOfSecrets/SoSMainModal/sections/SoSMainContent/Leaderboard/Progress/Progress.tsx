import { useTranslation, Trans } from 'react-i18next';
import {
    Wrapper,
    TopLabel,
    Line,
    Text,
    ProgressBar,
    PercentWrapper,
    PercentClip,
    PercentText,
    PercentTextOverlap,
    Bar,
    Inside,
} from './styles';

export default function Progress() {
    const { t } = useTranslation('sos', { useSuspense: false });

    const percent = 50;

    return (
        <Wrapper>
            <TopLabel>
                <Line />
                <Text>
                    <Trans t={t} i18nKey="progress.message" values={{ hours: 15 }} components={{ span: <span /> }} />
                </Text>
                <Line />
            </TopLabel>

            <ProgressBar>
                <Inside>
                    <Bar
                        style={{
                            width: `${percent}%`,
                        }}
                    />

                    <PercentWrapper>
                        <PercentText>{percent}%</PercentText>
                        <PercentClip $percent={percent}>
                            <PercentTextOverlap>{percent}%</PercentTextOverlap>
                        </PercentClip>
                    </PercentWrapper>
                </Inside>
            </ProgressBar>
        </Wrapper>
    );
}

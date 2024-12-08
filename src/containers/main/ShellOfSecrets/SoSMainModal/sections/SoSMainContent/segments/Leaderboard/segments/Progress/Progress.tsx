/* eslint-disable i18next/no-literal-string */
import { useState } from 'react';
import {
    Wrapper,
    TopLabel,
    Line,
    Text,
    CapLeft,
    CapRight,
    ProgressBar,
    PercentWrapper,
    PercentClip,
    PercentText,
    PercentTextOverlap,
    Bar,
    Inside,
} from './styles';

export default function Progress() {
    const [percent, setPercent] = useState(50);

    return (
        <Wrapper>
            <TopLabel>
                <Line />
                <Text>
                    You’re <span>15 hours</span> away from the next rank. Keep mining!
                </Text>
                <Line />
                <CapLeft />
                <CapRight />
            </TopLabel>

            <ProgressBar>
                <Inside>
                    <Bar
                        style={{
                            width: `${percent}%`,
                        }}
                    />

                    <PercentWrapper>
                        <PercentText>100%</PercentText>
                        <PercentClip $percent={percent}>
                            <PercentTextOverlap>100%</PercentTextOverlap>
                        </PercentClip>
                    </PercentWrapper>
                </Inside>
            </ProgressBar>
        </Wrapper>
    );
}

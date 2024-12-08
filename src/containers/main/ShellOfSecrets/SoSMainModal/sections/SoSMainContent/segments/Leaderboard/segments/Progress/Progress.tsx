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

    const handleClick = () => {
        setPercent((prevPercent) => (prevPercent === 50 ? 100 : 50));
    };

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

            <ProgressBar onClick={handleClick}>
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

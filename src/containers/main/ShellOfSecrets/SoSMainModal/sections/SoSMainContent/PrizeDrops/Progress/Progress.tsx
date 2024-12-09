import { useState } from 'react';
import { Wrapper, PercentWrapper, PercentClip, PercentText, PercentTextOverlap, Bar, Inside } from './styles';

export default function Progress() {
    const [percent, setPercent] = useState(50);

    return (
        <Wrapper>
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
        </Wrapper>
    );
}

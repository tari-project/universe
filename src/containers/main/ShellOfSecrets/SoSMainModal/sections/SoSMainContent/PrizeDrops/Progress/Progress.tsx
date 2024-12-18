import { Wrapper, PercentWrapper, PercentClip, PercentText, PercentTextOverlap, Bar, Inside } from './styles';

interface Props {
    percent?: number;
    count?: number;
    total?: number;
}

export default function Progress({ percent, count, total }: Props) {
    const getDisplayValue = () => {
        if (percent !== undefined) {
            return `${percent}%`;
        }
        if (count !== undefined && total !== undefined) {
            return `${count} / ${total}`;
        }
        return '0%';
    };

    const getBarWidth = () => {
        if (percent !== undefined) {
            return percent;
        }
        if (count !== undefined && total !== undefined) {
            return (count / total) * 100;
        }
        return 0;
    };

    const displayValue = getDisplayValue();
    const barWidth = getBarWidth();

    return (
        <Wrapper>
            <Inside>
                <Bar style={{ width: `${barWidth}%` }} />
                <PercentWrapper>
                    <PercentText>{displayValue}</PercentText>
                    <PercentClip $percent={barWidth}>
                        <PercentTextOverlap>{displayValue}</PercentTextOverlap>
                    </PercentClip>
                </PercentWrapper>
            </Inside>
        </Wrapper>
    );
}

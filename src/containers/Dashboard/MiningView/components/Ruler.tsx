import { Column, MarkGroup, RulerMark, RulerMarkGroup, Wrapper } from './Ruler.styles.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from 'styled-components';

export function Ruler() {
    const theme = useTheme();
    const height = useMiningStore(useShallow((s) => s.displayBlockHeight));

    const topSegments = Array.from({ length: 16 }, (_, i) => i + 1);
    const rulerSegments = Array.from({ length: 14 }, (_, i) => i + 1);

    let heightSegment = height;

    const topMarkSegments = topSegments.map((segment, i) => {
        return (
            <MarkGroup key={`row-${segment}-${i}`}>
                <RulerMarkGroup>
                    <RulerMark $opacity={1} />
                    <RulerMark />
                    <RulerMark />
                    <RulerMark />
                    <RulerMark />
                </RulerMarkGroup>
            </MarkGroup>
        );
    });
    const bottomMarkSegments = rulerSegments.map((segment, i) => {
        const diff = height && height > 50 ? 10 : 5;
        const renderNumber = heightSegment && heightSegment > diff;
        if (renderNumber && heightSegment) {
            heightSegment -= diff;
        }

        return (
            <MarkGroup key={`row-${segment}-${i}`}>
                <RulerMarkGroup>
                    <RulerMark $opacity={1} data-before={heightSegment?.toString()}></RulerMark>
                    <RulerMark />
                    <RulerMark />
                    <RulerMark />
                    <RulerMark />
                </RulerMarkGroup>
            </MarkGroup>
        );
    });
    return (
        <Wrapper>
            <Column>
                {topMarkSegments}
                <RulerMarkGroup>
                    <RulerMark
                        $opacity={1}
                        data-before={height?.toString()}
                        animate={{
                            fontSize: '25px',
                            fontFamily: 'Druk, sans-serif',
                            color: theme.palette.text.primary,
                        }}
                    />
                    <RulerMark />
                    <RulerMark />
                    <RulerMark />
                    <RulerMark />
                </RulerMarkGroup>
                {bottomMarkSegments}
            </Column>
        </Wrapper>
    );
}

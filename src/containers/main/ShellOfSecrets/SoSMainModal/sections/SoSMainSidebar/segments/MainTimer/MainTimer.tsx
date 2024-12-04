/* eslint-disable i18next/no-literal-string */
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
    return (
        <Wrapper>
            <TopBar>
                <LineLeft />
                <SectionLabel>Your Timer</SectionLabel>
                <LineRight />
            </TopBar>

            <TimerColumn>
                <NumberGroup>
                    <Number>87</Number>
                    <Label>DAYS</Label>
                </NumberGroup>

                <NumberGroup>
                    <Number>12</Number>
                    <Label>HOURS</Label>
                </NumberGroup>

                <NumberGroup>
                    <Number>42</Number>
                    <Label>MINUTES</Label>
                </NumberGroup>

                <NumberGroup
                    style={{
                        opacity: 0.5,
                    }}
                >
                    <Number>18</Number>
                    <Label>SECONDS</Label>
                </NumberGroup>

                <LineBottom />
            </TimerColumn>
        </Wrapper>
    );
}

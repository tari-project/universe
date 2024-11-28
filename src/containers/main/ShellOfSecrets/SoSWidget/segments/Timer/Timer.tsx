/* eslint-disable i18next/no-literal-string */
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

export default function Timer() {
    return (
        <Wrapper>
            <VerticalText>
                You’re getting close
                <DividerLineLeft />
                <DividerLineRight />
            </VerticalText>

            <TimerColumn>
                <NumberGroup>
                    <Number>87</Number>
                    <Label>days</Label>
                </NumberGroup>

                <NumberGroup>
                    <Number>12</Number>
                    <Label>hours</Label>
                </NumberGroup>
            </TimerColumn>
        </Wrapper>
    );
}

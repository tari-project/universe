/* eslint-disable i18next/no-literal-string */
import {
    Wrapper,
    VerticalText,
    Divider,
    DividerLineTop,
    DividerLineBottom,
    TimerColumn,
    NumberGroup,
    Number,
    Label,
} from './styles';

export default function Timer() {
    return (
        <Wrapper>
            <VerticalText>You’re getting close</VerticalText>

            <Divider>
                <DividerLineTop />
                <DividerLineBottom />
            </Divider>

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

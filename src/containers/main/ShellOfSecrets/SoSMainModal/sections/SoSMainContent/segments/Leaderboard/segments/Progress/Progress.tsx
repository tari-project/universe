/* eslint-disable i18next/no-literal-string */
import { Wrapper, TopLabel, Line, Text, CapLeft, CapRight } from './styles';

export default function Progress() {
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
        </Wrapper>
    );
}

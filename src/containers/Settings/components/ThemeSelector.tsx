import styled from 'styled-components';
import RadioButton from '@app/components/elements/inputs/RadioButton.tsx';

const Wrapper = styled.fieldset`
    width: 100%;
    display: flex;
    position: relative;
    gap: 15px;
`;

export default function ThemeSelector() {
    return (
        <Wrapper>
            <RadioButton id="system" name="theme_select" value="system" label="system" disabled />
            <RadioButton id="light" name="theme_select" value="light" label="light" />
            <RadioButton id="dark" name="theme_select" value="dark" label="dark" />
        </Wrapper>
    );
}

import { BaseSelect } from './BaseSelect.tsx';
import { Container, LabelWrapper, Wrapper } from './styles.ts';
import { TimeParts } from './types.ts';

interface TimePickerProps {
    label?: string;
    initialTime?: TimeParts;
}

export const TimePicker = ({ label, initialTime }: TimePickerProps) => {
    return (
        <Container>
            <Wrapper>
                {label && <LabelWrapper>{label}</LabelWrapper>}
                <BaseSelect initialTime={initialTime} />
            </Wrapper>
        </Container>
    );
};

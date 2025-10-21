import { BaseSelect } from './BaseSelect.tsx';
import { Container, LabelWrapper, Wrapper } from './styles.ts';
import { TimeParts } from '@app/types/mining/schedule.ts';

interface TimePickerProps {
    label?: string;
    initialTime?: TimeParts;
    handleOnChange?: (time: TimeParts) => void;
}

export const TimePicker = ({ label, initialTime, handleOnChange }: TimePickerProps) => {
    return (
        <Container>
            <Wrapper>
                {label && <LabelWrapper>{label}</LabelWrapper>}
                <BaseSelect initialTime={initialTime} onChange={handleOnChange} />
            </Wrapper>
        </Container>
    );
};

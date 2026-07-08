import { BaseSelect } from './BaseSelect.tsx';
import { Container, LabelWrapper, Wrapper } from './styles.ts';
import { TimeParts } from '@app/types/mining/schedule.ts';

interface TimePickerProps {
    label?: string;
    initialTime?: TimeParts;
    handleOnChange?: (time: TimeParts) => void;
    testId?: string;
}

export const TimePicker = ({ label, initialTime, handleOnChange, testId }: TimePickerProps) => {
    return (
        <Container data-testid={testId}>
            <Wrapper>
                {label && <LabelWrapper>{label}</LabelWrapper>}
                <BaseSelect initialTime={initialTime} onChange={handleOnChange} />
            </Wrapper>
        </Container>
    );
};

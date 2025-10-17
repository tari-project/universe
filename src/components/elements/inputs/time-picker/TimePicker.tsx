import { BaseSelect } from './BaseSelect.tsx';
import { LabelWrapper, Wrapper } from './styles.ts';
import { TimeParts } from './types.ts';

interface TimePickerProps {
    label?: string;
    initialTime?: TimeParts;
}

export const TimePicker = ({ label, initialTime }: TimePickerProps) => {
    return (
        <Wrapper>
            {label && <LabelWrapper>{label}</LabelWrapper>}
            <BaseSelect initialTime={initialTime} />
        </Wrapper>
    );
};

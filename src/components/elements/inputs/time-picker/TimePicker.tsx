import { BaseSelect } from './BaseSelect.tsx';
import { LabelWrapper, Wrapper } from './styles.ts';

interface TimePickerProps {
    label?: string;
}

export const TimePicker = ({ label }: TimePickerProps) => {
    return (
        <Wrapper>
            {label && <LabelWrapper>{label}</LabelWrapper>}
            <BaseSelect />
        </Wrapper>
    );
};

import { BaseSelect } from './BaseSelect.tsx';
import { InputWrapper, LabelWrapper, Wrapper } from './styles.ts';

interface TimePickerProps {
    label?: string;
}

const hourOptions = Array.from({ length: 12 }).map((_, i) => `${i + 1}`);
const minuteOptions = Array.from({ length: 59 }).map((_, i) => `${i + 1}`);
export const TimePicker = ({ label }: TimePickerProps) => {
    return (
        <Wrapper>
            {label && <LabelWrapper>{label}</LabelWrapper>}
            <InputWrapper>
                <BaseSelect options={hourOptions} />
                {`:`}
                <BaseSelect options={minuteOptions} />
            </InputWrapper>
        </Wrapper>
    );
};

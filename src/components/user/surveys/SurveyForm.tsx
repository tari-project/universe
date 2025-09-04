import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { Survey } from '@app/types/user/surveys.ts';
import { Checkbox } from '@app/components/elements/inputs/Checkbox.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import {
    CTAWrapper,
    Description,
    Form,
    FormContent,
    ItemWrapper,
    TextItem,
    TextItemLabel,
} from './surveyForm.styles.ts';

import { FieldQuestions, getFieldTypes } from './helpers.ts';
import RadioButton from '@app/components/elements/inputs/RadioButton.tsx';

interface SurveyFormProps {
    surveyContent: Survey;
}

export default function SurveyForm({ surveyContent }: SurveyFormProps) {
    const formFields = getFieldTypes(surveyContent.questions || []);
    const { control, setValue } = useForm<FieldQuestions>({
        defaultValues: formFields,
    });
    const { fields: textFields } = useFieldArray({ control, name: 'text' });
    const { fields: radioFields } = useFieldArray({ control, name: 'radio' });
    const { fields: checkFields } = useFieldArray({ control, name: 'checkbox' });

    const checkFieldMarkup = checkFields.map((q, i) => {
        const shouldRenderQuestionText = q.questionId !== checkFields[i - 1]?.questionId;
        return (
            <>
                {shouldRenderQuestionText && <Description>{q.questionText}</Description>}
                <Controller
                    control={control}
                    key={q.id}
                    name={`checkbox.${i}.checked`}
                    render={({ field }) => {
                        function handleChange(value: boolean) {
                            setValue(field.name, value);
                        }
                        return (
                            <ItemWrapper key={q.id}>
                                <Checkbox
                                    id={field.name}
                                    labelText={q.optionText}
                                    checked={field.value}
                                    handleChange={handleChange}
                                />
                            </ItemWrapper>
                        );
                    }}
                />
            </>
        );
    });
    const textfieldMarkup = textFields.map((q, i) => {
        return (
            <Controller
                key={q.id}
                control={control}
                name={`text.${i}.value`}
                render={({ field }) => {
                    return (
                        <>
                            <TextItemLabel htmlFor={field.name}>
                                {q.questionText} <span>{`(optional)`}</span>
                            </TextItemLabel>
                            <TextItem
                                {...field}
                                placeholder={`Add any other details here`}
                                variant="secondary"
                                rows={1}
                            />
                        </>
                    );
                }}
            />
        );
    });

    const radiofieldMarkup = radioFields.map((q, i) => {
        const shouldRenderQuestionText = q.questionId !== radioFields[i - 1]?.questionId;
        return (
            <>
                {shouldRenderQuestionText && <Description>{q.questionText}</Description>}
                <Controller
                    key={q.id}
                    control={control}
                    name={`radio.${i}.value`}
                    render={({ field }) => {
                        return (
                            <RadioButton
                                {...field}
                                label={q.optionText}
                                onChange={(e) => setValue(field.name, e.target.id)}
                            />
                        );
                    }}
                />
            </>
        );
    });

    return (
        <Form>
            <FormContent>
                {radiofieldMarkup}
                {/*{checkFieldMarkup}*/}
                {/*{textfieldMarkup}*/}
            </FormContent>
            <CTAWrapper>
                <Button type="submit" fluid size="xlarge" variant="black">{`Send Feedback`}</Button>
                <TextButton size="large" type="reset">
                    <Typography>{`Skip for now`}</Typography>
                </TextButton>
            </CTAWrapper>
        </Form>
    );
}

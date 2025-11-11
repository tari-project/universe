import {
    SurveyAnswerInput,
    SurveyQuestion,
    SurveyQuestionOption,
    SurveyQuestionType,
} from '@app/types/user/surveys.ts';

type FieldMainQuestion = Pick<SurveyQuestion, 'questionText' | 'questionType' | 'options' | 'isRequired'>;
type FieldQuestionOption = Pick<SurveyQuestionOption, 'questionId' | 'id'>;

export interface FieldQuestion extends FieldMainQuestion, FieldQuestionOption {
    value: string;
    questionId: string;
    optionText?: string;
    checked?: boolean;
}

export type FieldQuestions = Record<SurveyQuestionType, FieldQuestion[]>;

export function getFieldTypes(questions: SurveyQuestion[]): FieldQuestions {
    const initial: FieldQuestions = { checkbox: [], radio: [], text: [] };
    return questions.reduce((a, c) => {
        const typeArr = a[c.questionType];

        if (typeArr) {
            if (c.questionType === 'checkbox' && c.options?.length) {
                c.options.forEach((option) => {
                    const fieldOption: FieldQuestion = {
                        ...option,
                        questionId: c.id,
                        questionType: c.questionType,
                        questionText: c.questionText,
                        isRequired: c.isRequired,
                        checked: false,
                        value: '',
                    };

                    typeArr.push(fieldOption);
                });
            } else {
                const fieldQuestion: FieldQuestion = {
                    ...c,
                    questionId: c.id,
                    options: c.options?.map((o) => ({ ...o, checked: false })),
                    value: '',
                };
                typeArr.push(fieldQuestion);
            }
        }
        return a;
    }, initial);
}

export function parseAnswers(data: FieldQuestions): SurveyAnswerInput[] {
    const textAnswers =
        data.text?.map((a) => ({
            questionId: a.questionId,
            answerText: a.value?.length ? `${a.value}` : `[No additional feedback submitted]`,
        })) || [];
    const radioAnswers =
        data.radio
            .filter((a) => a.options?.some((o) => o.checked))
            .map((a) => {
                const selectedOptionId = a.options?.find((o) => o.checked)?.id;
                return {
                    questionId: a.questionId,
                    selectedOptionIds: selectedOptionId ? [selectedOptionId] : undefined,
                };
            }) || [];

    const checkedItems = data.checkbox.filter((a) => a.checked);
    const checkAnswers: SurveyAnswerInput[] = [];

    checkedItems.forEach((a) => {
        const existingEntry = checkAnswers.find((e) => a.questionId === e.questionId);
        if (existingEntry) {
            existingEntry.selectedOptionIds?.push(a.id);
        } else {
            checkAnswers.push({
                questionId: a.questionId,
                selectedOptionIds: [a.id],
            });
        }
    });

    return [...textAnswers, ...radioAnswers, ...checkAnswers];
}

import {
    SurveyAnswerInput,
    SurveyQuestion,
    SurveyQuestionOption,
    SurveyQuestionType,
} from '@app/types/user/surveys.ts';

type FieldMainQuestion = Pick<SurveyQuestion, 'questionText' | 'questionType' | 'options'>;
type FieldQuestionOption = Pick<SurveyQuestionOption, 'questionId'>;

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
                        checked: false,
                        value: '',
                    };

                    typeArr.push(fieldOption);
                });
            } else {
                const fieldQuestion: FieldQuestion = {
                    ...c,
                    questionId: c.id,
                    value: '',
                };
                typeArr.push(fieldQuestion);
            }
        }
        return a;
    }, initial);
}

export function parseResponse(data: FieldQuestions) {
    let answers: SurveyAnswerInput[] = [];

    const textAnswers =
        data.text?.map((a) => ({
            questionId: a.questionId,
            answerText: a.value,
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

    console.debug(JSON.stringify(data.checkbox));

    const checkAnswers =
        data.checkbox
            .filter((a) => a.options?.some((o) => o.checked))
            .map((a) => {
                const selectedOptionIds = a.options?.filter((o) => o.checked).map((o) => o.id);
                return {
                    questionId: a.questionId,
                    selectedOptionIds: selectedOptionIds?.length ? selectedOptionIds : undefined,
                };
            }) || [];

    answers = [...textAnswers, ...radioAnswers, ...checkAnswers];
    return answers;
}

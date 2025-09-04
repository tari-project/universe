import { SurveyQuestion, SurveyQuestionOption, SurveyQuestionType } from '@app/types/user/surveys.ts';

type FieldMainQuestion = Pick<SurveyQuestion, 'questionText' | 'questionType'>;
type FieldQuestionOption = Pick<SurveyQuestionOption, 'questionId'>;

interface FieldQuestion extends FieldMainQuestion, FieldQuestionOption {
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
            if (c.options?.length) {
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

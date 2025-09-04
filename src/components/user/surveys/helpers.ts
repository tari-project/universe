import { SurveyQuestion, SurveyQuestionOption, SurveyQuestionType } from '@app/types/user/surveys.ts';

type CheckOpt = SurveyQuestionOption & { checked: boolean };
interface QuestionFields {
    textQuestions: SurveyQuestion[];
    checkOptions: CheckOpt[];
}

type FieldMainQuestion = Pick<SurveyQuestion, 'questionText' | 'questionType'>;
type FieldQuestionOption = Pick<SurveyQuestionOption, 'id' | 'questionId'>;

interface FieldQuestion extends FieldMainQuestion, FieldQuestionOption {
    optionText?: string;
    checked?: boolean;
    value?: string;
}

type FieldQuestions = Partial<Record<SurveyQuestionType, FieldQuestion[]>>;

export function getFieldTypes(questions: SurveyQuestion[]) {
    const initial: FieldQuestions = {
        checkbox: [],
        radio: [],
        text: [],
    };
    const parsed = questions.reduce((a, c) => {
        const typeArr = a[c.questionType];
        const fieldQuestion: FieldQuestion = {
            ...c,
            questionId: c.id,
            value: '',
            checked: false,
        };

        if (typeArr) {
            typeArr.push(fieldQuestion);
        }

        return a;
    }, initial);

    console.debug(JSON.stringify(parsed));
}

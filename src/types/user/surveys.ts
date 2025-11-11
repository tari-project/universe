const _SURVEYS = ['close', 'long'] as const;
const _QUESTION_TYPE = ['checkbox', 'radio', 'text'] as const;

type SurveyTuple = typeof _SURVEYS;
type QuestionTuple = typeof _QUESTION_TYPE;

export type SurveyType = SurveyTuple[number];
export type SurveyQuestionType = QuestionTuple[number];

export interface SurveyQuestionOption {
    id: string;
    questionId: string;
    optionText: string;
    value: string;
    order: number;
    checked?: boolean;
}

export interface SurveyQuestion {
    id: string;
    surveyId: string;
    questionText: string;
    questionType: SurveyQuestionType;
    order: number;
    options?: SurveyQuestionOption[];
    isRequired: boolean;
    value?: string;
}

export interface Survey {
    id: string;
    title: string;
    type: SurveyType;
    description?: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    questions?: SurveyQuestion[];
}

// Error Response Type
export interface ApiError {
    error: string;
    message: string;
}

export interface SurveyAnswerInput {
    questionId: string;
    answerText?: string;
    selectedOptionIds?: string[];
}

export interface SurveyMetadata {
    userId?: string;
    appId?: string;
    operatingSystem?: string;
    universeVersion?: string;
    network?: string;
    mode?: string;
    extraData?: Record<string, unknown>;
}

export interface SubmitSurveyRequest {
    answers: SurveyAnswerInput[];
    metadata?: SurveyMetadata;
}

export interface SubmitSurveyResponse {
    message: string;
    responseId: string;
}

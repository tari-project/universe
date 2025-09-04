import { SurveyType } from '@app/types/user/surveys.ts';
import { useFetchSurveyContent } from '@app/hooks/user/surveys/useFetchSurveyContent.ts';
import { Chip } from '@app/components/elements/Chip.tsx';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import SurveyForm from './form/SurveyForm.tsx';

import { ChipText, Title, Wrapper } from './styles.ts';

interface UserSurveyProps {
    type: SurveyType;
}
export default function UserSurvey({ type }: UserSurveyProps) {
    const { data: survey, isLoading } = useFetchSurveyContent(type);
    const loadingMarkup = isLoading && <LoadingDots />;
    const markup = !!survey && (
        <>
            <Title variant="h1">{survey.description}</Title>
            {survey.questions && <SurveyForm surveyContent={survey} />}
        </>
    );

    return (
        <Wrapper>
            <Chip size="large">
                <ChipText>{`Feedback`}</ChipText>
            </Chip>
            {loadingMarkup}
            {markup}
        </Wrapper>
    );
}

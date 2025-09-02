import { Chip } from '@app/components/elements/Chip.tsx';
import { Description, Title, Wrapper } from './styles.ts';
import { useFetchSurveyContent } from '@app/hooks/user/surveys/useFetchSurveyContent.ts';
import SurveyForm from './SurveyForm.tsx';

export default function UserSurvey() {
    const { data: survey } = useFetchSurveyContent();
    return survey ? (
        <Wrapper>
            <Chip>
                <p>{`Feedback`}</p>
            </Chip>
            <Title variant="h1">{survey.title}</Title>
            <Description>{survey.description}</Description>

            {survey.questions && <SurveyForm questions={survey.questions} />}
        </Wrapper>
    ) : null;
}

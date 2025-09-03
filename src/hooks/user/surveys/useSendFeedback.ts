import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { SubmitSurveyRequest, SubmitSurveyResponse } from '@app/types/user/surveys.ts';
import { useMutation } from '@tanstack/react-query';

interface Args {
    slug: string;
    feedbackBody: SubmitSurveyRequest;
}

async function postFeedback({ slug, feedbackBody }: Args) {
    console.debug(feedbackBody);
    return await handleAirdropRequest<SubmitSurveyResponse, SubmitSurveyRequest>({
        path: `/survey/${slug}/response`,
        method: 'POST',
        publicRequest: true,
        body: feedbackBody,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export function useSendFeedback() {
    return useMutation({ mutationFn: postFeedback, onSuccess: (data) => console.debug(data) });
}

//        const answers = watchedField
//             .map((f) => {
//                 if (f.questionType === 'text') {
//                     return {
//                         questionId: f.id,
//                         answerText: f.value,
//                     };
//                 }
//                 return null;
//                 // if (f.questionType === 'checkbox') {
//                 //     const selectedOptionIds = f.checked ? [f.id] : [];
//                 //     return {
//                 //         questionId: f.id,
//                 //         selectedOptionIds,
//                 //     };
//                 // }
//             })
//             .filter((x) => !!x) as SurveyAnswerInput[];
//
//         const metadata = {
//             userId: anon_id,
//             appId: anon_id,
//             operatingSystem: 'string',
//             universeVersion: 'string',
//             network: 'string',
//             mode: 'string',
//             extraData: {},
//         };
//
//         mutate({
//             slug: 'survey-close',
//             feedbackBody: {
//                 answers,
//                 metadata,
//             },
//         });

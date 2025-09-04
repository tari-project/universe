import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { SubmitSurveyRequest, SubmitSurveyResponse } from '@app/types/user/surveys.ts';
import { useMutation } from '@tanstack/react-query';

interface Args {
    slug: string;
    feedbackBody: SubmitSurveyRequest;
}

async function postFeedback({ slug, feedbackBody }: Args) {
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

import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { ApiError, Survey } from '@app/types/user/surveys.ts';
import { useQuery } from '@tanstack/react-query';

const KEY_SURVEYS = 'surveys';
type SurveysResponse = Survey[];

async function fetchSurveys() {
    try {
        const res = await handleAirdropRequest<SurveysResponse>({
            path: '/survey',
            method: 'GET',
            publicRequest: true,
        });
        console.debug(res);
        if (res) {
            return res;
        } else {
            console.error('No surveys');
            return [];
        }
    } catch (_e) {
        const error = _e as unknown as ApiError;
        console.error(error.message);
        return [];
    }
}
// might not need this
// we should add survey type to admin

export function useFetchSurveys() {
    return useQuery<SurveysResponse>({
        queryKey: [KEY_SURVEYS],
        queryFn: async () => await fetchSurveys(),
    });
}

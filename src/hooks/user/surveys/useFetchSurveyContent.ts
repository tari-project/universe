import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { ApiError, Survey } from '@app/types/user/surveys.ts';
import { useQuery } from '@tanstack/react-query';

const KEY_SURVEYS = 'surveys';

export async function fetchSurvey(slug: string): Promise<Survey> {
    try {
        const res = await handleAirdropRequest<Survey>({
            path: `/survey/${slug}`,
            method: 'GET',
            publicRequest: true,
        });
        if (res) {
            return res;
        } else {
            console.error('No such survey');
            return {} as unknown as Survey;
        }
    } catch (_e) {
        const error = _e as unknown as ApiError;
        console.error(error.message);
        return {} as unknown as Survey;
    }
}

export function useFetchSurveyContent(slug: string) {
    return useQuery<Survey>({
        queryKey: [KEY_SURVEYS, slug],
        queryFn: async () => await fetchSurvey(slug),
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 30,
    });
}

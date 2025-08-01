import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { useAirdropStore } from '@app/store';
import type { CrewMembersResponse } from '@app/store/useAirdropStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const KEY_CREW_MEMBERS = 'crew_members';

async function fetchCrewMembersData(params: {
    status: 'all' | 'completed' | 'active' | 'inactive';
    page: number;
    limit: number;
}): Promise<CrewMembersResponse> {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);
    searchParams.append('page', params.page.toString());
    searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const path = `/crew/members?${queryString}`;

    const response = await handleAirdropRequest<CrewMembersResponse>({
        path,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response?.filters?.status) {
        throw new Error('Failed to fetch crew members');
    }

    return response;
}

export function useCrewMembers() {
    // Read query params from store
    const crewQueryParams = useAirdropStore((state) => state.crewQueryParams);

    // Read airdrop token from store for dependency array
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);

    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: [KEY_CREW_MEMBERS, crewQueryParams, airdropToken],
        queryFn: () => fetchCrewMembersData(crewQueryParams),
        enabled: !!airdropToken, // Only run when authenticated
        refetchOnWindowFocus: true,
        staleTime: 30 * 1000, // 30 seconds
        retry: 2,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({
            queryKey: [KEY_CREW_MEMBERS],
        });
    };

    return {
        ...query,
        invalidate,
    };
}

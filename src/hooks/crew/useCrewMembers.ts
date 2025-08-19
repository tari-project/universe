import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { useAirdropStore, useWalletStore } from '@app/store';
import { setCrewQueryParams } from '@app/store/actions/airdropStoreActions';
import type { MembersResponse } from '@app/store/useAirdropStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const KEY_CREW_MEMBERS = 'crew_members';

async function fetchCrewMembersData(props: {
    status: 'all' | 'completed' | 'active' | 'inactive';
    walletReceiveKey: string;
    page: number;
    limit: number;
}): Promise<MembersResponse> {
    const { walletReceiveKey, ...params } = props;
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);
    searchParams.append('page', params.page.toString());
    searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const path = `/crew/members?${queryString}`;

    const response = await handleAirdropRequest<MembersResponse>({
        path,
        method: 'POST',
        body: {
            walletReceiveKey,
        },
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
    const crewQueryParams = useAirdropStore((state) => state.crewQueryParams);
    const walletReceiveKey = useWalletStore((s) => s.tari_address_base58);
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);

    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: [KEY_CREW_MEMBERS, crewQueryParams, airdropToken, walletReceiveKey],
        queryFn: () => fetchCrewMembersData({ ...crewQueryParams, walletReceiveKey }),
        enabled: !!airdropToken && !!walletReceiveKey,
        refetchOnWindowFocus: true,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        retry: 2,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({
            queryKey: [KEY_CREW_MEMBERS],
        });
    };

    // Pagination controls
    const nextPage = () => {
        const pagination = query.data?.pagination;
        if (pagination && crewQueryParams.page < pagination.totalPages) {
            setCrewQueryParams({ page: crewQueryParams.page + 1 });
        }
    };

    const prevPage = () => {
        if (crewQueryParams.page > 1) {
            setCrewQueryParams({ page: crewQueryParams.page - 1 });
        }
    };

    const goToPage = (page: number) => {
        const pagination = query.data?.pagination;
        if (pagination && page >= 1 && page <= pagination.totalPages) {
            setCrewQueryParams({ page });
        }
    };

    const setPageSize = (limit: number) => {
        setCrewQueryParams({ limit, page: 1 });
    };

    // Pagination metadata
    const pagination = query.data?.pagination;
    const currentPage = crewQueryParams.page;
    const pageSize = crewQueryParams.limit;
    const totalPages = pagination?.totalPages ?? 0;
    const totalItems = pagination?.total ?? 0;
    const hasNextPage = pagination ? currentPage < pagination.totalPages : false;
    const hasPrevPage = currentPage > 1;

    return {
        ...query,
        invalidate,
        // Pagination controls
        nextPage,
        prevPage,
        goToPage,
        setPageSize,
        // Pagination metadata
        currentPage,
        pageSize,
        totalPages,
        totalItems,
        hasNextPage,
        hasPrevPage,
        pagination,
    };
}

import { useCrewMembers } from './useCrewMembers';

export function useReferrerProgress() {
    const { data, isLoading, error } = useCrewMembers();

    return {
        referrerProgress: data?.referrerProgress,
        isLoading,
        error,
    };
}

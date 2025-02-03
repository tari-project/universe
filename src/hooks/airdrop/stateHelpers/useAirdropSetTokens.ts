import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAirdropRequest } from '../utils/useHandleRequest';
import { useAirdropStore } from '@app/store/useAirdropStore';

export const useAirdropSetTokenToUuid = () => {
    const handleRequest = useAirdropRequest();
    const airdropUser = useAirdropStore((state) => state.userDetails?.user.name);

    const handleSetTokens = useCallback(async () => {
        if (!airdropUser) return;
        const generatedAuthUuid = uuidv4();
        const data = await handleRequest<{ success: boolean }>({
            path: `/auth/set-token/${generatedAuthUuid}`,
            method: 'POST',
        });
        if (!data?.success) return;
        return encodeURI(generatedAuthUuid);
    }, [handleRequest, airdropUser]);

    return handleSetTokens;
};

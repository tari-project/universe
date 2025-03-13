import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { handleAirdropRequest } from '../utils/useHandleRequest';
import { useAirdropStore } from '@app/store/useAirdropStore';

export const useAirdropSetTokenToUuid = () => {
    const airdropUser = useAirdropStore((state) => state.userDetails?.user.name);

    return useCallback(async () => {
        if (!airdropUser) return;
        const generatedAuthUuid = uuidv4();
        const data = await handleAirdropRequest<{ success: boolean }>({
            path: `/auth/set-token/${generatedAuthUuid}`,
            method: 'POST',
        });
        if (!data?.success) return;
        return encodeURI(generatedAuthUuid);
    }, [airdropUser]);
};

import { useAirdropStore } from "@app/store/useAirdropStore";
// import { useInterval } from "../useInterval";
import { useEffect } from "react";
import { invoke } from '@tauri-apps/api/tauri';

export function useAirdropTokensRefresh() {
    const { airdropTokens, setAirdropTokens } = useAirdropStore();

    // Handle refreshing the access token
    // const handleRefresh = useCallback(() => {
    //     if (airdropTokens && airdropTokens.expiresAt && Date.now() > airdropTokens.expiresAt) {
    //         fetch('https://airdrop.tari.com/api/auth/local/refresh', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 refreshToken: airdropTokens.refreshToken
    //             })
    //         })
    //             .then(response => response.json())
    //             .then((data) => {
    //                 setAirdropTokens(data);
    //             });
    //     }
    // }, [airdropTokens, setAirdropTokens]);

    // useInterval(handleRefresh, 1000 * 60 * 60);

    // Handle setting the access token
    useEffect(() => {
        if (!airdropTokens) return;
        invoke('set_airdrop_access_token', {token: airdropTokens?.token})
            .catch((error) => {
                console.error('Error getting airdrop tokens', error);
            });
    }, [airdropTokens]);
}

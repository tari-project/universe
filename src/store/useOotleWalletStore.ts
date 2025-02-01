import { create } from './create.ts';
import { useTappletProviderStore } from './useTappletProviderStore.ts';
import { stringToSubstateId, substateIdToString } from '@tari-project/wallet_jrpc_client';
import { OotleAccount } from '@app/containers/floating/Settings/sections/ootleWallet/types.ts';

interface State {
    ootle_address?: string;
    ootle_name?: string;
    balance: number | null;
}

interface Actions {
    createAccount: (name: string) => Promise<void>;
    fetchOotleWalletDetails: () => Promise<void>;
}

type OotleWalletStoreState = State & Actions;

const initialState: State = {
    ootle_address: '',
    balance: null,
};

export const useOotleWalletStore = create<OotleWalletStoreState>()((set) => ({
    ...initialState,
    createAccount: async (name: string) => {
        const provider = useTappletProviderStore.getState().tappletProvider;
        try {
            // if tapplet uses TU Provider it gets default account
            // this is to make sure tapplet uses the account selected by the user
            if (!provider) {
                return;
            }

            const responseNewAcc = await provider.createFreeTestCoins(name);

            console.error('created acc: ', responseNewAcc);
            await provider.client.accountsSetDefault({
                account: {
                    Name: name,
                },
            });
            const account = await provider.client.accountsGet({
                name_or_address: { Name: name },
            });
            set({
                ootle_name: name,
                ootle_address: substateIdToString(account.account.address),
            });
        } catch (error) {
            console.error('Could not create new account: ', error);
        }
    },
    fetchOotleWalletDetails: async () => {
        const provider = useTappletProviderStore.getState().tappletProvider;
        try {
            // if tapplet uses TU Provider it gets default account
            // this is to make sure tapplet uses the account selected by the user
            if (!provider) {
                return;
            }
            const account = (await provider.getAccount()) as OotleAccount;
            set({
                balance: account.resources[0].balance,
            });
            // TODO
        } catch (error) {
            console.error('Could not get tari wallet details: ', error);
        }
    },
}));

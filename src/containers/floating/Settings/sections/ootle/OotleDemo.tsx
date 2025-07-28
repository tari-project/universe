import { useState } from 'react';
import { ootleListAccounts, ootleCreateAccount, ootleGetBalances } from '../../../../../store/actions/ootleActions';
import {
    AccountsCreateRequest,
    AccountsGetBalancesRequest,
    AccountsListRequest,
} from '@tari-project/typescript-bindings';
import { Button } from '@app/components/elements/buttons/Button';

export const OotleDemo = () => {
    const title = 'Ootle Demo';
    const [response, setResponse] = useState<string | null>(null);

    const handleListAccounts = async () => {
        const request: AccountsListRequest = {
            offset: 0,
            limit: 1000,
        };
        const result = await ootleListAccounts(request);
        setResponse(JSON.stringify(result, null, 2));
    };

    const handleCreateAccount = async () => {
        const request: AccountsCreateRequest = {
            account_name: 'test-account',
            custom_access_rules: null,
            max_fee: null,
            is_default: true,
            key_id: null,
        };
        const result = await ootleCreateAccount(request);
        setResponse(JSON.stringify(result, null, 2));
    };

    const handleGetBalances = async () => {
        const request: AccountsGetBalancesRequest = { account: null, refresh: false };
        const result = await ootleGetBalances(request);
        setResponse(JSON.stringify(result, null, 2));
    };

    return (
        <div>
            <h1>{title}</h1>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <Button onClick={handleListAccounts}>{'List Accounts'}</Button>
                <Button onClick={handleCreateAccount}>{'Create Account'}</Button>
                <Button onClick={handleGetBalances}>{'Get Balances'}</Button>
            </div>
            {response && (
                <div>
                    <h2>{'Response:'}</h2>
                    <pre
                        style={{
                            background: '#f0f0f0',
                            padding: '10px',
                            border: '1px solid #ccc',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {response}
                    </pre>
                </div>
            )}
        </div>
    );
};

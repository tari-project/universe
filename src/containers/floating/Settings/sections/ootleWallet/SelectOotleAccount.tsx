import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import { DialogContent, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useOotleWalletStore } from '@app/store/useOotleWalletStore';
import { AccountInfo } from '@tari-project/typescript-bindings';
import { OotleAccount } from '@app/types/ootle';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { Input } from '@app/components/elements/inputs/Input';
import { SettingsGroup } from '../../components/SettingsGroup.styles';

interface SelectAccountProps {
    accountsList: AccountInfo[];
    currentAccount?: OotleAccount;
}

function SelectOotleAccount({ accountsList, currentAccount }: SelectAccountProps) {
    // const currentAccount = useOotleWalletStore((s) => s.ootleAccount);
    const createAccount = useOotleWalletStore((s) => s.createAccount);
    const setDefaultAccount = useOotleWalletStore((s) => s.setDefaultAccount);
    const currentAccountName = currentAccount?.account_name ?? '';
    const [newAccountName, setNewAccountName] = useState('');

    const handleCreateNewAccount = useCallback(async () => {
        console.info('CREATE ACCOUNT', newAccountName);
        await createAccount(newAccountName);
    }, [createAccount, newAccountName]);

    const handleChange = useCallback(
        async (event: SelectChangeEvent) => {
            console.info('CHANGE ACCOUNT TO: ', event.target.value);
            return await setDefaultAccount(event.target.value);
        },
        [setDefaultAccount]
    );

    const onAddAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewAccountName(e.target.value);
    };

    //TODO refactor select component
    return (
        <Box sx={{ minWidth: 250 }}>
            <DialogContent className="dialog-content">
                <FormControl fullWidth>
                    <Select
                        labelId="account-select-label"
                        id="account-select"
                        value={
                            accountsList.some((account: AccountInfo) => account.account.name == currentAccountName)
                                ? currentAccountName
                                : 'Select account'
                        }
                        label="Account"
                        onChange={handleChange}
                    >
                        {accountsList.map((account: AccountInfo) => {
                            if (account.account.name === null) {
                                return null;
                            }
                            return (
                                <MenuItem key={account.public_key} value={account.account.name}>
                                    {account.account.name}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>
                <SettingsGroup>
                    <Input
                        name="new-account-name"
                        type="text"
                        placeholder="New account name"
                        value={newAccountName}
                        onChange={onAddAccountChange}
                    />
                    <SquaredButton
                        onClick={handleCreateNewAccount}
                        color="tariPurple"
                        size="medium"
                        style={{ width: '50%', alignContent: 'center', marginBottom: 10 }}
                    >
                        {'Create account'}
                    </SquaredButton>
                </SettingsGroup>
            </DialogContent>
        </Box>
    );
}

export default SelectOotleAccount;

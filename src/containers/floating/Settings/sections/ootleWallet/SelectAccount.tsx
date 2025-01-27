import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import { AccountInfo } from './types';
import { Button, DialogContent, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';

interface SelectAccountProps {
    onSubmit: (name: string) => void;
    accountsList: AccountInfo[];
    currentAccount?: AccountInfo;
}

function SelectAccount({ onSubmit, accountsList, currentAccount }: SelectAccountProps) {
    const currentAccountName = currentAccount?.account.name ?? '';
    console.log(accountsList);
    const [newAccountName, setNewAccountName] = useState(currentAccountName);

    const handleChange = () => {
        //TODO set account store
    };

    const handleSubmit = useCallback(async () => {
        return onSubmit(newAccountName);
    }, [newAccountName, onSubmit]);

    const onAddAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewAccountName(e.target.value);
    };

    return (
        <Box sx={{ minWidth: 250 }}>
            <DialogContent className="dialog-content">
                <FormControl fullWidth>
                    <InputLabel id="account-select-label" />
                    <Select
                        labelId="account-select-label"
                        id="account-select"
                        value={
                            accountsList.some((account: AccountInfo) => account.account.name == currentAccountName)
                                ? currentAccountName
                                : ''
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

                <Box display="flex" flexDirection="row" gap={2} alignItems="center" py={4}>
                    <TextField
                        name="accountName"
                        label="Account Name"
                        value={newAccountName}
                        onChange={onAddAccountChange}
                        style={{ flexGrow: 1 }}
                    />
                    <Button onClick={handleSubmit} variant="contained" sx={{ width: 200 }}>
                        {'create-account'}
                    </Button>
                </Box>
            </DialogContent>
        </Box>
    );
}

export default SelectAccount;

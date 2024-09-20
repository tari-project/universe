import {useCallback, useState} from 'react';
import {Stack} from '@app/components/elements/Stack.tsx';
import {Typography} from '@app/components/elements/Typography.tsx';
import MoneroAddressEditor from './MoneroAddressEditor';
import {useAppConfigStore} from '@app/store/useAppConfigStore';
import {IconButton} from "@app/components/elements/Button.tsx";
import {CircularProgress} from "@app/components/elements/CircularProgress.tsx";
import {IoEyeOffOutline, IoEyeOutline} from "react-icons/io5";
import {SeedWords} from "@app/containers/SideBar/components/Settings/Markups/SeedWordsMarkup/SeedWords.tsx";
import {
    useGetMoneroSeedWords
} from "@app/containers/SideBar/components/Settings/Markups/MoneroAddressMarkup/useGetMoneroSeedWords.ts";

const MoneroAddressMarkup = () => {
    const moneroAddress = useAppConfigStore((s) => s.monero_address);
    const setMoneroAddress = useAppConfigStore((s) => s.setMoneroAddress);

    const [showMoneroSeedWords, setShowSeedWords] = useState(false);
    const {
        moneroSeedWords,
        getMoneroSeedWords,
        moneroSeedWordsFetched,
        moneroSeedWordsFetching
    } = useGetMoneroSeedWords();

    const toggleSeedWordsVisibility = useCallback(async () => {
        if (!moneroSeedWordsFetched) {
            await getMoneroSeedWords();
        }
        setShowSeedWords((prev) => !prev);
    }, [moneroSeedWordsFetched, getMoneroSeedWords]);

    const handleMoneroAddressChange = useCallback(
        async (moneroAddress: string) => {
            await setMoneroAddress(moneroAddress);
        },
        [setMoneroAddress]
    );

    return (
        <Stack>
            <Stack direction="row" justifyContent="space-between" style={{height: 40}}>
                <Typography variant="h6">Monero Address</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
                <MoneroAddressEditor initialAddress={moneroAddress || ''} onApply={handleMoneroAddressChange}/>
            </Stack>
            <Stack>
                <Stack direction="row" style={{height: 40}} justifyContent="flex-start" alignItems="center">
                    <Typography variant="h6">Monero Seed Words</Typography>
                    <IconButton onClick={toggleSeedWordsVisibility} disabled={moneroSeedWordsFetching}>
                        {moneroSeedWordsFetching ? (
                            <CircularProgress/>
                        ) : showMoneroSeedWords ? (
                            <IoEyeOffOutline size={18}/>
                        ) : (
                            <IoEyeOutline size={18}/>
                        )}
                    </IconButton>
                </Stack>
                <SeedWords showMoneroSeedWords={showMoneroSeedWords} moneroSeedWords={moneroSeedWords}/>
            </Stack>
        </Stack>
    );
};

export default MoneroAddressMarkup;

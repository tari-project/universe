import React, { useState } from 'react';

import {
    IoSettingsOutline,
    IoClose,
    IoCopyOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoCheckmarkOutline,
} from 'react-icons/io5';
import { useGetSeedWords } from '../../../../hooks/useGetSeedWords';
import truncateString from '../../../../utils/truncateString';
import { invoke } from '@tauri-apps/api/tauri';

import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import VisualMode from '../../../Dashboard/components/VisualMode';
import { DialogContent, Form, HorisontalBox } from './Settings.styles';

import { useForm } from 'react-hook-form';
import ConnectButton from '@app/containers/Airdrop/components/ConnectButton/ConnectButton.tsx';

import { Button, IconButton } from '@app/components/elements/Button.tsx';
import Dialog from '@app/components/elements/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Divider } from '@app/components/elements/Divider.tsx';
import TelemetryMode from '@app/containers/Dashboard/components/TelemetryMode.tsx';

import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import AppVersions from '@app/containers/SideBar/components/Settings/AppVersions.tsx';
import LanguageSettings from '@app/containers/SideBar/components/Settings/LanguageSettings.tsx';
import HardwareStatus from '@app/containers/SideBar/components/Settings/HardwareStatus.tsx';

import DebugSettings from '@app/containers/SideBar/components/Settings/DebugSettings.tsx';

enum FormFields {
    IDLE_TIMEOUT = 'idleTimeout',
}

interface FormState {
    [FormFields.IDLE_TIMEOUT]: number;
}

export default function Settings() {
    const userInActivityTimeout = useAppStatusStore((state) => state.user_inactivity_timeout);

    const [open, setOpen] = useState(true);
    const [showSeedWords, setShowSeedWords] = useState(false);
    const [isCopyTooltipHidden, setIsCopyTooltipHidden] = useState(true);
    const { reset, handleSubmit } = useForm<FormState>({
        defaultValues: { idleTimeout: userInActivityTimeout },
        mode: 'onSubmit',
    });
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords();

    const handleClickOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setShowSeedWords(false);
    };

    const toggleSeedWordsVisibility = async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }
        setShowSeedWords((p) => !p);
    };

    const copySeedWords = async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }
        setIsCopyTooltipHidden(false);
        await navigator.clipboard.writeText(seedWords.join(' '));
        setTimeout(() => setIsCopyTooltipHidden(true), 1000);
    };

    const handleCancel = () => {
        reset({ idleTimeout: userInActivityTimeout });
    };

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.info('submitting');
        handleSubmit(
            (data) => {
                console.info(typeof data[FormFields.IDLE_TIMEOUT]);
                invoke('set_user_inactivity_timeout', {
                    timeout: Number(data[FormFields.IDLE_TIMEOUT]),
                });
                invoke('set_auto_mining', { autoMining: false });
                handleClose();
            },
            (error) => {
                console.error(error);
            }
        )();
    };

    const seedWordMarkup = (
        <Stack>
            <Stack direction="row" justifyContent="space-between" style={{ height: 40 }}>
                <Typography variant="h6">Seed Words</Typography>
                {showSeedWords && seedWordsFetched && (
                    <IconButton onClick={copySeedWords}>
                        {isCopyTooltipHidden ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                    </IconButton>
                )}
            </Stack>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="p">
                    {showSeedWords
                        ? truncateString(seedWords.join(' '), 50)
                        : '****************************************************'}
                </Typography>
                <IconButton onClick={toggleSeedWordsVisibility} disabled={seedWordsFetching}>
                    {seedWordsFetching ? (
                        <CircularProgress />
                    ) : showSeedWords ? (
                        <IoEyeOffOutline size={18} />
                    ) : (
                        <IoEyeOutline size={18} />
                    )}
                </IconButton>
            </Stack>
        </Stack>
    );

    const idleTimerMarkup = (
        <Form onSubmit={onSubmit}>
            <Stack>
                <Typography variant="h6">Time after which machine is considered idle</Typography>
                <input name="idle" placeholder="Enter idle timeout in seconds" type="int" />
            </Stack>
            <Stack direction="row" justifyContent="flex-end">
                <Button onClick={handleCancel}>Cancel</Button>
                <Button type="submit" styleVariant="contained">
                    Submit
                </Button>
            </Stack>
        </Form>
    );

    return (
        <>
            <IconButton onClick={handleClickOpen}>
                <IoSettingsOutline size={16} />
            </IconButton>
            <Dialog onClose={handleClose} open={open}>
                <DialogContent>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="h4">Settings</Typography>
                        <IconButton onClick={handleClose}>
                            <IoClose size={20} />
                        </IconButton>
                    </Stack>
                    <Divider />
                    {seedWordMarkup}
                    <Divider />
                    {idleTimerMarkup}
                    <Divider />
                    <LanguageSettings />
                    <Divider />
                    <DebugSettings />
                    <Divider />
                    <HardwareStatus />
                    <Divider />
                    <AppVersions />
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                        <VisualMode />
                        <TelemetryMode />
                    </Stack>
                    <Divider />
                    <ConnectButton />
                </DialogContent>
            </Dialog>
        </>
    );
}

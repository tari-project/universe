import React, { useState } from 'react';
import { CgEye, CgEyeAlt, CgCopy } from 'react-icons/cg';
import {
    IconButton,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Box,
    Typography,
    Divider,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import { IoSettingsOutline, IoClose } from 'react-icons/io5';
import { useGetSeedWords } from '../../../hooks/useGetSeedWords';
import truncateString from '../../../utils/truncateString';
import { invoke } from '@tauri-apps/api/tauri';
import { useGetApplicatonsVersions } from '../../../hooks/useGetApplicatonsVersions';
import { useForm } from 'react-hook-form';
import { useAppStatusStore } from '../../../store/useAppStatusStore';
import { ControlledNumberInput } from '../../../components/NumberInput';

enum FormFields {
    IDLE_TIMEOUT = 'idleTimeout',
}

interface FormState {
    [FormFields.IDLE_TIMEOUT]: number;
}

const Settings: React.FC = () => {
    const { refreshVersions, applicationsVersions, mainAppVersion } = useGetApplicatonsVersions();
    const userInActivityTimeout = useAppStatusStore((state) => state.user_inactivity_timeout);
    console.log(userInActivityTimeout);
    const [open, setOpen] = useState(false);
    const { reset, handleSubmit, control } = useForm<FormState>({
        defaultValues: { idleTimeout: userInActivityTimeout },
        mode: 'onSubmit',
    });

    const [showSeedWords, setShowSeedWords] = useState(false);
    const [isCopyTooltipHidden, setIsCopyTooltipHidden] = useState(true);
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords();

    const handleClickOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setShowSeedWords(false);
    };

    const handleCancel = () => {
        reset({ idleTimeout: userInActivityTimeout });
    };

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log('submitting');
        handleSubmit(
            (data) => {
                console.log(typeof data[FormFields.IDLE_TIMEOUT]);
                invoke('set_user_inactivity_timeout', {
                    timeout: Number(data[FormFields.IDLE_TIMEOUT]),
                });
                handleClose();
            },
            (error) => {
                console.log(error);
            }
        )();
    };

    const openLogsDirectory = () => {
        invoke('open_log_dir')
            .then(() => {
                console.log('Opening logs directory');
            })
            .catch((error) => {
                console.error(error);
            });
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
        navigator.clipboard.writeText(seedWords.join(','));
        setTimeout(() => setIsCopyTooltipHidden(true), 1000);
    };

    return (
        <>
            <IconButton onClick={handleClickOpen}>
                <IoSettingsOutline size={16} />
            </IconButton>
            <Dialog open={open} onClose={handleClose}>
                <DialogContent
                    style={{
                        width: '600px',
                        height: '600px',
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" pb={1}>
                        <Typography variant="h4">Settings</Typography>
                        <IconButton onClick={handleClose}>
                            <IoClose size={20} />
                        </IconButton>
                    </Stack>
                    <Divider />
                    <Box my={1}>
                        <Typography sx={{}} variant="h5">
                            Seed Words
                        </Typography>
                        <Stack flexDirection="row" alignItems="center" gap={1}>
                            <Typography variant="body2">
                                {showSeedWords
                                    ? truncateString(seedWords.join(','), 50)
                                    : '****************************************************'}
                            </Typography>
                            {seedWordsFetching ? (
                                <CircularProgress size="34px" />
                            ) : (
                                <>
                                    <IconButton onClick={toggleSeedWordsVisibility}>
                                        {showSeedWords ? <CgEyeAlt /> : <CgEye />}
                                    </IconButton>
                                    <Tooltip
                                        title="Copied!"
                                        placement="top"
                                        open={!isCopyTooltipHidden}
                                        disableFocusListener
                                        disableHoverListener
                                        disableTouchListener
                                        PopperProps={{ disablePortal: true }}
                                    >
                                        <IconButton onClick={copySeedWords}>
                                            <CgCopy />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )}
                        </Stack>
                    </Box>
                    <form onSubmit={onSubmit}>
                        <Box my={1}>
                            <Typography variant="h5">Random</Typography>
                            <Stack spacing={1} pt={1}>
                                <ControlledNumberInput
                                    name={FormFields.IDLE_TIMEOUT}
                                    control={control}
                                    title="Idle Timeout"
                                    endAdornment="miliseconds"
                                    placeholder="Enter idle timeout in seconds"
                                    type="int"
                                    rules={{
                                        max: {
                                            value: 21600000,
                                            message: 'Maximum is 21600000 milliseconds ( 6 hours )',
                                        },
                                        min: {
                                            value: 1000,
                                            message: 'Minimum is 1000 milliseconds ( 1 second )',
                                        },
                                    }}
                                />
                            </Stack>
                            <Divider />
                            <DialogActions>
                                <Button onClick={handleCancel} variant="outlined">
                                    Cancel
                                </Button>
                                <Button type="submit" variant="contained">
                                    Submit
                                </Button>
                            </DialogActions>
                        </Box>
                    </form>
                    <Divider />
                    {applicationsVersions && (
                        <Stack spacing={1} pt={1}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="h5">Versions</Typography>
                                <Button onClick={refreshVersions}>Refresh Versions</Button>
                            </Stack>
                            <Divider />
                            <Typography>mainApp: {mainAppVersion}</Typography>
                            {Object.entries(applicationsVersions).map(([key, value]) => (
                                <Typography key={key}>
                                    {key}: {value}
                                </Typography>
                            ))}
                        </Stack>
                    )}
                    <Stack spacing={1} pt={1}>
                        <Button onClick={openLogsDirectory}>Open logs directory</Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Settings;

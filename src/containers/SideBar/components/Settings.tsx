import React, { useState } from 'react';
import {
    IconButton,
    Dialog,
    DialogContent,
    Button,
    Stack,
    Typography,
    Divider,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import { IoSettingsOutline, IoClose, IoCopyOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { useGetSeedWords } from '../../../hooks/useGetSeedWords';
import truncateString from '../../../utils/truncateString';
import { invoke } from '@tauri-apps/api/tauri';

import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useGetApplicationsVersions } from '../../../hooks/useGetApplicationsVersions.ts';
import VisualMode from '../../Dashboard/components/VisualMode';
import { HorisontalBox, RightHandColumn } from './Settings.styles';

const Settings: React.FC = () => {
    const applicationsVersions = useAppStatusStore((state) => state.applications_versions);
    const mainAppVersion = useAppStatusStore((state) => state.main_app_version);
    const refreshVersions = useGetApplicationsVersions();
    const [open, setOpen] = useState(false);
    const [showSeedWords, setShowSeedWords] = useState(false);
    const [isCopyTooltipHidden, setIsCopyTooltipHidden] = useState(true);
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords();

    const handleClickOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setShowSeedWords(false);
    };

    const openLogsDirectory = () => {
        invoke('open_log_dir')
            .then(() => {
                console.info('Opening logs directory');
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
        await navigator.clipboard.writeText(seedWords.join(','));
        setTimeout(() => setIsCopyTooltipHidden(true), 1000);
    };

    return (
        <>
            <IconButton onClick={handleClickOpen}>
                <IoSettingsOutline size={16} />
            </IconButton>
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth={'sm'}>
                <DialogContent>
                    <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" pb={1}>
                            <Typography variant="h4">Settings</Typography>
                            <IconButton onClick={handleClose}>
                                <IoClose size={20} />
                            </IconButton>
                        </Stack>
                        <Divider />
                        <Stack spacing={1} pt={1} pb={1} direction="column">
                            <Typography variant="h6">Seed Words</Typography>
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
                                            {showSeedWords ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
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
                                                <IoCopyOutline size={18} />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                            </Stack>
                        </Stack>
                        <Divider />
                        <HorisontalBox>
                            <Typography variant="h6">Logs</Typography>
                            <RightHandColumn>
                                <Button onClick={openLogsDirectory} variant="text">
                                    Open logs directory
                                </Button>
                            </RightHandColumn>
                        </HorisontalBox>
                        <Divider />
                        {applicationsVersions && (
                            <>
                                <HorisontalBox>
                                    <Typography variant="h6">Versions</Typography>
                                    <RightHandColumn>
                                        <Button onClick={refreshVersions} variant="text">
                                            Refresh Versions
                                        </Button>
                                    </RightHandColumn>
                                </HorisontalBox>
                                <Stack spacing={0}>
                                    <Typography variant="body2">mainApp: {mainAppVersion}</Typography>
                                    {Object.entries(applicationsVersions).map(([key, value]) => (
                                        <Typography variant="body2" key={key}>
                                            {key}: {value}
                                        </Typography>
                                    ))}
                                </Stack>
                            </>
                        )}
                        <Divider />
                        <HorisontalBox>
                            <VisualMode />
                        </HorisontalBox>
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Settings;

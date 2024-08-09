import React, { useState } from 'react';
import { CgEye, CgEyeAlt, CgCopy } from 'react-icons/cg';
import {
    IconButton,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    TextField,
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

const Settings: React.FC = () => {
    const { refreshVersions, applicationsVersions } =
        useGetApplicatonsVersions();
    const [open, setOpen] = useState(false);
    const [formState, setFormState] = useState({ field1: '', field2: '' });
    const [showSeedWords, setShowSeedWords] = useState(false);
    const [isCopyTooltipHidden, setIsCopyTooltipHidden] = useState(true);
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } =
        useGetSeedWords();

    const handleClickOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setFormState({ field1: '', field2: '' });
        setShowSeedWords(false);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormState((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleCancel = () => {
        setFormState({ field1: '', field2: '' });
        handleClose();
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // console.log(formState);
        handleClose();
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
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        pb={1}
                    >
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
                                    <IconButton
                                        onClick={toggleSeedWordsVisibility}
                                    >
                                        {showSeedWords ? (
                                            <CgEyeAlt />
                                        ) : (
                                            <CgEye />
                                        )}
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
                    <Box component="form" onSubmit={handleSubmit} my={1}>
                        <Typography variant="h5">Random</Typography>
                        <Stack spacing={1} pt={1}>
                            <TextField
                                label="Field 1"
                                name="field1"
                                value={formState.field1}
                                onChange={handleChange}
                            />
                            <TextField
                                label="Field 2"
                                name="field2"
                                value={formState.field2}
                                onChange={handleChange}
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
                    <Divider />
                    <DialogActions>
                        <Button onClick={handleCancel} variant="outlined">
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained">
                            Submit
                        </Button>
                    </DialogActions>
                    {applicationsVersions && (
                        <Stack spacing={1} pt={1}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                            >
                                <Typography variant="h5">Versions</Typography>
                                <Button onClick={refreshVersions}>
                                    Refresh Versions
                                </Button>
                            </Stack>
                            <Divider />
                            {Object.entries(applicationsVersions).map(
                                ([key, value]) => (
                                    <Typography key={key}>
                                        {key}: {value}
                                    </Typography>
                                )
                            )}
                        </Stack>
                    )}
                    <Stack spacing={1} pt={1}>
                        <Button onClick={openLogsDirectory}>
                            Open logs directory
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Settings;

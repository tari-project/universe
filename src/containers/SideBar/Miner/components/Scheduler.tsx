import React, { useState } from 'react';
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
} from '@mui/material';
import { IoClose } from 'react-icons/io5';
import { IoCalendar } from 'react-icons/io5';
import { ScheduleButton } from '../styles';
import { useTranslation } from 'react-i18next';

function Scheduler() {
    const { t } = useTranslation(['sidebar', 'common'], { useSuspense: false });

    const [open, setOpen] = useState(false);

    const handleClickOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleCancel = () => {
        handleClose();
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleClose();
    };

    return (
        <>
            <ScheduleButton variant="contained" startIcon={<IoCalendar size="16" />} onClick={handleClickOpen}>
                {t('setup-scheduler', { ns: 'sidebar' })}
            </ScheduleButton>
            <Dialog open={open} onClose={handleClose}>
                <DialogContent
                    style={{
                        width: '600px',
                        height: '600px',
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" pb={1}>
                        <Typography variant="h4">{t('mining-schedules', { ns: 'sidebar' })}</Typography>
                        <IconButton onClick={handleClose}>
                            <IoClose size={20} />
                        </IconButton>
                    </Stack>
                    <Divider />
                    <Box>
                        <Typography variant="body2" mt={2}>
                            {t('mining-schedules-description', { ns: 'sidebar' })}
                        </Typography>
                    </Box>
                    <Box component="form" onSubmit={handleSubmit}>
                        <DialogActions>
                            <Button onClick={handleCancel} variant="outlined">
                                {t('cancel', { ns: 'common' })}
                            </Button>
                            <Button type="submit" variant="contained">
                                {t('submit', { ns: 'common' })}
                            </Button>
                        </DialogActions>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default Scheduler;

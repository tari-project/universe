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

function Scheduler() {
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
                Setup scheduler
            </ScheduleButton>
            <Dialog open={open} onClose={handleClose}>
                <DialogContent
                    style={{
                        width: '600px',
                        height: '600px',
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" pb={1}>
                        <Typography variant="h4">Mining Schedules</Typography>
                        <IconButton onClick={handleClose}>
                            <IoClose size={20} />
                        </IconButton>
                    </Stack>
                    <Divider />
                    <Box>
                        <Typography variant="body2" mt={2}>
                            Schedule your mining activity
                        </Typography>
                    </Box>
                    <Box component="form" onSubmit={handleSubmit}>
                        <DialogActions>
                            <Button onClick={handleCancel} variant="outlined">
                                Cancel
                            </Button>
                            <Button type="submit" variant="contained">
                                Submit
                            </Button>
                        </DialogActions>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default Scheduler;

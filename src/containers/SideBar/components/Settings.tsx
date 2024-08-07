import React, { useState } from 'react';
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
} from '@mui/material';
import { IoSettingsOutline, IoClose } from 'react-icons/io5';

const Settings: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [formState, setFormState] = useState({ field1: '', field2: '' });

    const handleClickOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

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
                    <Box component="form" onSubmit={handleSubmit}>
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
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Settings;

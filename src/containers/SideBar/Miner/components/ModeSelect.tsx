import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/system';
import { modeType } from '@app/store/types';
import { IoCode } from 'react-icons/io5';
import { Typography } from '@mui/material';
import { TileItem } from '../styles';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { Theme, useTheme } from '@mui/material/styles';

const CustomSelect = styled(Select)(({ theme }: { theme: Theme }) => ({
    '& .MuiSelect-select': {
        padding: 0,
        textTransform: 'uppercase',
        fontSize: theme.typography.h5.fontSize,
        fontFamily: theme.typography.h5.fontFamily,
        lineHeight: theme.typography.h5.lineHeight,
    },
    '& .MuiOutlinedInput-notchedOutline': {
        border: 'none',
    },
}));

function ModeSelect() {
    const mode = useAppStatusStore((s) => s.mode);
    const setConfigMode = useAppStatusStore((s) => s.setConfigMode);

    const handleChange = (event: SelectChangeEvent<unknown>) => {
        setConfigMode(event.target.value as modeType);
    };
    const theme = useTheme();
    return (
        <TileItem>
            <Typography variant="body2">Mode</Typography>
            <FormControl fullWidth>
                <CustomSelect
                    labelId="select-mode-label"
                    id="select-mode"
                    theme={theme}
                    value={mode}
                    onChange={handleChange}
                    IconComponent={IoCode}
                    sx={{
                        '& .MuiSelect-icon': {
                            transform: 'rotate(90deg)',
                        },
                    }}
                >
                    <MenuItem value="Eco">Eco</MenuItem>
                    <MenuItem value="Ludicrous">Ludicrous</MenuItem>
                </CustomSelect>
            </FormControl>
        </TileItem>
    );
}

export default ModeSelect;

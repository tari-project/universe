import { Button, ButtonGroup, Stack, Typography } from '@mui/material';
import { viewType } from '../../store/types';
import { useState } from 'react';
import { useUIStore } from '../../store/useUIStore.ts';

function TestButtons() {
    const { view, setView, setBackground } = useUIStore((state) => ({
        view: state.view,
        setView: state.setView,
        setBackground: state.setBackground,
    }));
    const [selectedView, setSelectedView] = useState<viewType>(view);

    const handleSetView = (value: viewType) => {
        setView(value);
        setSelectedView(value);
        if (value === 'setup') {
            setBackground('onboarding');
        }
        if (value === 'tribes') {
            setBackground('loading');
        }
        if (value === 'mining') {
            setBackground('idle');
        }
    };

    // const handleSetStatus = (value: backgroundType) => {
    //   setBackground(value);
    //   setSelectedBg(value);
    // };

    return (
        <Stack direction="column" spacing={1}>
            <Typography variant="body2">For testing:</Typography>
            <ButtonGroup variant="outlined" fullWidth>
                <Button
                    variant={
                        selectedView === 'setup' ? 'contained' : 'outlined'
                    }
                    onClick={() => handleSetView('setup')}
                >
                    Setup
                </Button>
                <Button
                    variant={
                        selectedView === 'tribes' ? 'contained' : 'outlined'
                    }
                    onClick={() => handleSetView('tribes')}
                >
                    Tribes
                </Button>
                <Button
                    variant={
                        selectedView === 'mining' ? 'contained' : 'outlined'
                    }
                    onClick={() => handleSetView('mining')}
                >
                    Mining
                </Button>
            </ButtonGroup>
            {/* <Divider />
      <Typography variant="body2">Backgrounds:</Typography>
      <ButtonGroup variant="outlined" fullWidth>
        <Button
          variant={selectedBg === 'loading' ? 'contained' : 'outlined'}
          onClick={() => handleSetStatus('loading')}
        >
          Loading
        </Button>
        <Button
          variant={selectedBg === 'idle' ? 'contained' : 'outlined'}
          onClick={() => handleSetStatus('idle')}
        >
          Idle
        </Button>
        <Button
          variant={selectedBg === 'mining' ? 'contained' : 'outlined'}
          onClick={() => handleSetStatus('mining')}
        >
          Mining
        </Button>
      </ButtonGroup>
      <ButtonGroup variant="outlined" fullWidth>
        <Button
          variant={selectedBg === 'determining' ? 'contained' : 'outlined'}
          onClick={() => handleSetStatus('determining')}
        >
          Determining
        </Button>
        <Button
          variant={selectedBg === 'winner' ? 'contained' : 'outlined'}
          onClick={() => handleSetStatus('winner')}
        >
          Winner
        </Button>
        <Button
          variant={selectedBg === 'loser' ? 'contained' : 'outlined'}
          onClick={() => handleSetStatus('loser')}
        >
          Loser
        </Button>
      </ButtonGroup> */}
        </Stack>
    );
}

export default TestButtons;

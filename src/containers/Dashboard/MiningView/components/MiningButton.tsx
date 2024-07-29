import { useState } from 'react';
import { Button } from '@mui/material';
import { IoChevronForwardCircle, IoPauseCircle } from 'react-icons/io5';
import useAppStateStore from '../../../../store/appStateStore';

const StartStyle = {
  borderRadius: '30px',
  background: '#06C983',
  border: '1px solid #06C983',
  padding: '10px 18px',
  '&:hover': {
    background: '#ff0000',
  },
};

const StopStyle = {
  borderRadius: '30px',
  background: '#000000',
  border: '1px solid #000000',
  padding: '10px 18px',
};

function MiningButton() {
  const { startMining, stopMining, setBackground } = useAppStateStore();
  const [mining, setMining] = useState(false);

  const handleMining = () => {
    if (mining) {
      stopMining();
      setMining(false);
      setBackground('idle');
    } else {
      startMining();
      setMining(true);
      setBackground('mining');
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      style={mining ? StopStyle : StartStyle}
      onClick={() => handleMining()}
      endIcon={mining ? <IoPauseCircle /> : <IoChevronForwardCircle />}
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <span style={{ flexGrow: 1 }}>
        {mining ? 'Stop Mining' : 'Start Mining'}
      </span>
    </Button>
  );
}

export default MiningButton;

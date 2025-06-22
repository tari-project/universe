import { useState } from 'react';
import { ButtonWrapper } from './styles.ts';
import StartButton from './StartButton/StartButton.tsx';
import StopButton from './StopButton/StopButton.tsx';
import { AnimatePresence } from 'motion/react';

export default function MiningButtonCombined() {
    const [isMining, setIsMining] = useState(false);

    const handleStartMining = () => {
        setIsMining(true);
    };

    const handleStopMining = () => {
        setIsMining(false);
    };

    return (
        <ButtonWrapper>
            <AnimatePresence mode="popLayout">
                {!isMining ? <StartButton onClick={handleStartMining} /> : <StopButton onClick={handleStopMining} />}
            </AnimatePresence>
        </ButtonWrapper>
    );
}

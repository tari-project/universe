import { useState, useEffect } from 'react';

/**
 * Represents the state of the simple seconds countdown.
 */
interface CountdownResult {
    /** The number of seconds remaining in the countdown. */
    seconds: number;
    /** Boolean indicating if the countdown has finished (reached zero). */
    isFinished: boolean;
}

/**
 * Custom hook for managing a simple countdown timer in seconds.
 *
 * @param initialSeconds The total number of seconds to count down from.
 *                       Must be a non-negative integer.
 * @param onFinish Optional callback function to execute when the countdown finishes.
 * @returns An object containing the remaining seconds and a boolean
 *          indicating if the countdown has finished.
 */
export const useCountdown = (initialSeconds: number, onFinish?: () => void): CountdownResult => {
    // Ensure initialSeconds is a non-negative integer
    const validInitialSeconds = Math.max(0, Math.floor(initialSeconds));

    const [timeLeft, setTimeLeft] = useState<CountdownResult>({
        seconds: validInitialSeconds,
        isFinished: validInitialSeconds <= 0,
    });

    // Effect for handling the countdown timer interval
    useEffect(() => {
        // Reset the countdown state if initialSeconds changes
        setTimeLeft({
            seconds: validInitialSeconds,
            isFinished: validInitialSeconds <= 0,
        });

        // Don't start the interval if the countdown is already finished initially
        if (validInitialSeconds <= 0) {
            return; // No interval needed
        }

        // Set up the interval timer
        const timer = setInterval(() => {
            // Use functional update to get the latest state
            setTimeLeft((prevTimeLeft) => {
                // If for some reason the interval runs after finishing, stop it and return current state.
                if (prevTimeLeft.isFinished) {
                    clearInterval(timer);
                    return prevTimeLeft;
                }

                const newSeconds = prevTimeLeft.seconds - 1;
                const isFinished = newSeconds <= 0;

                // Clear interval inside the state setter to ensure
                // it's cleared exactly when the state indicates finished.
                if (isFinished) {
                    clearInterval(timer);
                }

                return {
                    seconds: newSeconds,
                    isFinished: isFinished,
                };
            });
        }, 1000); // Update every second

        // Cleanup function to clear the interval when the component unmounts
        // or when the initialSeconds changes before the countdown finishes.
        return () => clearInterval(timer);
    }, [validInitialSeconds]); // Re-run the effect only if validInitialSeconds changes

    // Effect for handling the onFinish callback trigger
    useEffect(() => {
        // Check if the countdown has finished and a callback is provided
        if (timeLeft.isFinished && onFinish) {
            onFinish();
        }
        // This effect runs whenever the finished state changes or the callback identity changes.
        // It ensures the callback is called if the state becomes finished.
    }, [timeLeft.isFinished, onFinish]);

    return timeLeft;
};

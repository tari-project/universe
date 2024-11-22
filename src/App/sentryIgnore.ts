const HISTORY = 'Already getting transaction history';
const METRICS = 'Already getting miner metrics';
const BALANCE = 'Already getting wallet balance';

export const ALREADY_FETCHING = {
    HISTORY,
    METRICS,
    BALANCE,
};
export const IGNORE_FETCHING = Object.values(ALREADY_FETCHING);

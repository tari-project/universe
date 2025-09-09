/* eslint-disable i18next/no-literal-string */
import { AdminButton, ButtonGroup, CategoryLabel, ExtraContent } from '../styles';

import {
    setMininimumMiningTimeMs,
    setShowCloseDialog,
    setShowLongTimeDialog,
    useUserFeedbackStore,
} from '@app/store/stores/userFeedbackStore.ts';
import { useState } from 'react';

function convertToMinutes(ms: number) {
    return ms / 1000 / 60;
}
function convertToMs(minutes: number) {
    return minutes * 60 * 1000;
}
export function FeedbackGroup() {
    const longMiningTimeMs = useUserFeedbackStore((s) => s.longMiningTimeMs);
    const closeMiningTimeMs = useUserFeedbackStore((s) => s.closeMiningTimeMs);
    const showCloseDialog = useUserFeedbackStore((s) => s.showCloseDialog);
    const showLongTimeDialog = useUserFeedbackStore((s) => s.showLongTimeDialog);

    const [closeMin, setCloseMin] = useState(convertToMinutes(closeMiningTimeMs));
    const [longMin, setLongMin] = useState(convertToMinutes(longMiningTimeMs));

    return (
        <>
            <CategoryLabel>Feedback</CategoryLabel>
            <ButtonGroup>
                <AdminButton onClick={() => setShowCloseDialog(!showCloseDialog)} $isActive={showCloseDialog}>
                    Early Close
                </AdminButton>
                <AdminButton onClick={() => setShowLongTimeDialog(!showLongTimeDialog)} $isActive={showLongTimeDialog}>
                    Long-time Miner
                </AdminButton>
            </ButtonGroup>
            <ExtraContent>
                <label>
                    CLOSE min time (minutes)
                    <input
                        name="close"
                        type="number"
                        value={closeMin}
                        onChange={(e) => {
                            let value = Number(e.target.value);
                            if (isNaN(value)) {
                                value = 1;
                            } else {
                                setCloseMin(value);
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setMininimumMiningTimeMs('closeMiningTimeMs', convertToMs(closeMin));
                        }}
                    >
                        save
                    </button>
                </label>

                <label>
                    LONG min time (minutes)
                    <input
                        name="long"
                        type="number"
                        value={longMin}
                        onChange={(e) => {
                            let value = Number(e.target.value);
                            if (isNaN(value)) {
                                value = 1;
                            } else {
                                setLongMin(value);
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setMininimumMiningTimeMs('longMiningTimeMs', convertToMs(longMin));
                        }}
                    >
                        save
                    </button>
                </label>
            </ExtraContent>
        </>
    );
}

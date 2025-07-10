import { listen } from '@tauri-apps/api/event';
import {
    updateCoreSetupPhaseInfo,
    updateHardwareSetupPhaseInfo,
    updateNodeSetupPhaseInfo,
    updateMiningSetupPhaseInfo,
    updateWalletSetupPhaseInfo,
} from '@app/store/actions/setupStoreActions';
import { PhaseTitle } from '@app/store/useSetupStore';
import { useEffect } from 'react';

export const PROGRESS_STATE_UPDATE = 'progress_tracker_update';

export interface ProgressTrackerUpdatePayload {
    phase_title: PhaseTitle;
    title: string;
    progress: number;
    title_params: Record<string, string>;
    is_complete: boolean;
}

export type ProgressStateUpdateEvent =
    | {
          event_type: 'Core';
          payload: ProgressTrackerUpdatePayload;
      }
    | {
          event_type: 'Node';
          payload: ProgressTrackerUpdatePayload;
      }
    | {
          event_type: 'Hardware';
          payload: ProgressTrackerUpdatePayload;
      }
    | {
          event_type: 'Mining';
          payload: ProgressTrackerUpdatePayload;
      }
    | {
          event_type: 'Wallet';
          payload: ProgressTrackerUpdatePayload;
      };

export const useProgressEventsListener = () => {
    useEffect(() => {
        const ul = listen(PROGRESS_STATE_UPDATE, async ({ payload: event }: { payload: ProgressStateUpdateEvent }) => {
            switch (event.event_type) {
                case 'Core':
                    updateCoreSetupPhaseInfo(event.payload);
                    break;
                case 'Node':
                    updateNodeSetupPhaseInfo(event.payload);
                    break;
                case 'Hardware':
                    updateHardwareSetupPhaseInfo(event.payload);
                    break;
                case 'Mining':
                    updateMiningSetupPhaseInfo(event.payload);
                    break;
                case 'Wallet':
                    updateWalletSetupPhaseInfo(event.payload);
                    break;
                default:
                    break;
            }
        });

        return () => {
            ul.then((fn) => fn());
        };
    }, []);
};

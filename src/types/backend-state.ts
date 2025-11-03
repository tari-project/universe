import {
    BackgroundNodeSyncUpdatePayload,
    ConnectionStatusPayload,
    CriticalProblemPayload,
    DetectedAvailableGpuEngines,
    DetectedDevicesPayload,
    GpuMiner,
    GpuMinerType,
    MinerControlsState,
    NewBlockHeightPayload,
    NodeTypeUpdatePayload,
    ProgressTrackerUpdatePayload,
    SetupPhase,
    ShowReleaseNotesPayload,
    TariAddressUpdatePayload,
    WalletUIMode,
} from './events-payloads.ts';
import {
    BaseNodeStatus,
    CpuMinerStatus,
    GpuMinerStatus,
    NetworkStatus,
    PoolStats,
    SystemDependency,
    WalletBalance,
} from './app-status.ts';
import { ConfigCore, ConfigMining, ConfigPools, ConfigUI, ConfigWallet, GpuDeviceSettings } from './configs.ts';
import { DisabledPhasesPayload } from '@app/store/actions/setupStoreActions.ts';
import { AppModuleState } from '@app/store/types/setup.ts';

export const BACKEND_STATE_UPDATE = 'backend_state_update';
export type BackendStateUpdateEvent =
    | {
          event_type: 'UpdateAppModuleStatus';
          payload: AppModuleState;
      }
    | {
          event_type: 'UpdateTorEntryGuards';
          payload: string[];
      }
    | {
          event_type: 'SetupProgressUpdate';
          payload: ProgressTrackerUpdatePayload;
      }
    | {
          event_type: 'BaseNodeUpdate';
          payload: BaseNodeStatus;
      }
    | {
          event_type: 'WalletBalanceUpdate';
          payload: WalletBalance;
      }
    | {
          event_type: 'CpuMiningUpdate';
          payload: CpuMinerStatus;
      }
    | {
          event_type: 'GpuMiningUpdate';
          payload: GpuMinerStatus;
      }
    | {
          event_type: 'NewBlockHeight';
          payload: NewBlockHeightPayload;
      }
    | {
          event_type: 'CloseSplashscreen';
          payload: undefined;
      }
    | {
          event_type: 'DetectedDevices';
          payload: DetectedDevicesPayload;
      }
    | {
          event_type: 'DetectedAvailableGpuEngines';
          payload: DetectedAvailableGpuEngines;
      }
    | {
          event_type: 'CriticalProblem';
          payload: CriticalProblemPayload;
      }
    | {
          event_type: 'SystemDependenciesLoaded';
          payload: SystemDependency[];
      }
    | {
          event_type: 'StuckOnOrphanChain';
          payload: boolean;
      }
    | {
          event_type: 'ShowReleaseNotes';
          payload: ShowReleaseNotesPayload;
      }
    | {
          event_type: 'NetworkStatus';
          payload: NetworkStatus;
      }
    | {
          event_type: 'InitialSetupFinished';
          payload: undefined;
      }
    | {
          event_type: 'NodeTypeUpdate';
          payload: NodeTypeUpdatePayload;
      }
    | {
          event_type: 'ConfigCoreLoaded';
          payload: ConfigCore;
      }
    | {
          event_type: 'ConfigUILoaded';
          payload: ConfigUI;
      }
    | {
          event_type: 'ConfigWalletLoaded';
          payload: ConfigWallet;
      }
    | {
          event_type: 'ConfigMiningLoaded';
          payload: ConfigMining;
      }
    | {
          event_type: 'ConfigPoolsLoaded';
          payload: ConfigPools;
      }
    | {
          event_type: 'RestartingPhases';
          payload: SetupPhase[];
      }
    | {
          event_type: 'AskForRestart';
          payload: undefined;
      }
    | {
          event_type: 'BackgroundNodeSyncUpdate';
          payload: BackgroundNodeSyncUpdatePayload;
      }
    | {
          event_type: 'InitWalletScanningProgress';
          payload: {
              scanned_height: number;
              total_height: number;
              progress: number;
          };
      }
    | {
          event_type: 'ConnectionStatus';
          payload: ConnectionStatusPayload;
      }
    | {
          event_type: 'CpuPoolsStatsUpdate';
          payload: Record<string, PoolStats>;
      }
    | {
          event_type: 'GpuPoolsStatsUpdate';
          payload: Record<string, PoolStats>;
      }
    | {
          event_type: 'ExchangeIdChanged';
          payload: string;
      }
    | {
          event_type: 'DisabledPhases';
          payload: DisabledPhasesPayload;
      }
    | {
          event_type: 'ShouldShowExchangeMinerModal';
          payload: undefined;
      }
    | {
          event_type: 'SelectedTariAddressChanged';
          payload: TariAddressUpdatePayload;
      }
    | {
          event_type: 'WalletUIModeChanged';
          payload: WalletUIMode;
      }
    | {
          event_type: 'ShowKeyringDialog';
          payload: undefined;
      }
    | {
          event_type: 'CreatePin';
          payload: undefined;
      }
    | {
          event_type: 'EnterPin';
          payload: undefined;
      }
    | {
          event_type: 'UpdateGpuDevicesSettings';
          payload: Record<number, GpuDeviceSettings>;
      }
    | {
          event_type: 'PinLocked';
          payload: boolean;
      }
    | {
          event_type: 'SeedBackedUp';
          payload: boolean;
      }
    | {
          event_type: 'UpdateSelectedMiner';
          payload: GpuMinerType;
      }
    | {
          event_type: 'AvailableMiners';
          payload: Record<GpuMinerType, GpuMiner>;
      }
    | {
          event_type: 'WalletStatusUpdate';
          payload: {
              loading: boolean;
              unhealthy?: boolean;
          };
      }
    | {
          event_type: 'UpdateCpuMinerControlsState';
          payload: MinerControlsState;
      }
    | {
          event_type: 'UpdateGpuMinerControlsState';
          payload: MinerControlsState;
      }
    | {
          event_type: 'OpenSettings';
          payload: undefined;
      }
    | {
          event_type: 'SystrayAppShutdownRequested';
          payload: undefined;
      }
    | {
          event_type: 'ShowEcoAlert';
          payload: undefined;
      }
    | {
          event_type: 'FeedbackSurveyRequested';
          payload: undefined;
      }
    | {
          event_type: 'ShutdownModeSelectionRequested';
          payload: undefined;
      }
    | {
          event_type: 'ShuttingDown';
          payload: undefined;
      }
    | {
          event_type: 'ShowBatteryAlert';
          payload: undefined;
      };

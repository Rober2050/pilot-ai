import { VoiceControlContent } from '../VoiceControlContent';
import { PlaybackState } from '../../../../types/voice';

interface VoicePanelProps {
    state: PlaybackState;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    onVolumeChange: (volume: number) => void;
    onSpeedChange: (speed: number) => void;
    queueLength: number;
}

export const VoicePanel: React.FC<VoicePanelProps> = (props) => {
    return <VoiceControlContent {...props} />;
};

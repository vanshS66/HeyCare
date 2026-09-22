// Recording controls and the live transcription panel. All Web Speech
// lifecycle lives in useSpeechRecognition; this file only renders it.
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Pause, Play, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpeechRecognition, SpeechRecognitionOptions } from '@/hooks/useSpeechRecognition';

// Props allow parent components to receive the evolving transcript,
// the final transcript, and optionally trigger AI analysis during pauses.
// They are exactly the recorder's callbacks, so the hook owns the signatures.
type VoiceRecorderProps = SpeechRecognitionOptions;

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptUpdate,
  onRecordingComplete,
  onTranscriptAnalysis,
}) => {
  const {
    recordingState,
    transcript,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseOrResume,
  } = useSpeechRecognition({ onTranscriptUpdate, onRecordingComplete, onTranscriptAnalysis });

  const isRecording = recordingState === 'recording';
  const isPaused = recordingState === 'paused';
  const isIdle = recordingState === 'idle';

  // Every control is disabled while the browser has no speech support; Start
  // is additionally only live when idle, the other two only when not idle.
  const controlClass = (disabled: boolean) =>
    cn(
      "px-8 py-3 text-lg font-medium transition-all duration-200",
      disabled && "opacity-50 cursor-not-allowed"
    );

  return (
    <Card className="medical-card p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Voice Recording</h2>
          <p className="text-muted-foreground">
            {isRecording && 'Recording in progress...'}
            {isPaused && 'Recording paused'}
            {isIdle && 'Ready to record patient conversation'}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <Button
            onClick={() => startRecording(false)}
            disabled={!isIdle || !isSupported}
            variant="default"
            size="lg"
            className={controlClass(!isIdle || !isSupported)}
          >
            <Mic className="w-5 h-5 mr-2" />
            Start
          </Button>

          <Button
            onClick={pauseOrResume}
            disabled={isIdle || !isSupported}
            variant="secondary"
            size="lg"
            className={controlClass(isIdle || !isSupported)}
          >
            {isPaused ? (
              <>
                <Play className="w-5 h-5 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            )}
          </Button>

          <Button
            onClick={stopRecording}
            disabled={isIdle || !isSupported}
            variant="destructive"
            size="lg"
            className={controlClass(isIdle || !isSupported)}
          >
            <Square className="w-5 h-5 mr-2" />
            Stop
          </Button>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex justify-center">
            <div className="recording-pulse bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-sm font-medium">
              🔴 Recording...
            </div>
          </div>
        )}

        {/* Live transcription display */}
        {(isRecording || isPaused || transcript) && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-foreground mb-3">Live Transcription</h3>
            <div className="bg-muted/50 border border-border rounded-lg p-4 min-h-[120px] max-h-[300px] overflow-y-auto">
              <p className="transcription-text text-foreground whitespace-pre-wrap">
                {transcript && transcript.trim() ? (
                  transcript
                ) : (
                  <span className="text-muted-foreground italic">
                    {isRecording ? 'Listening... Start speaking to see transcription.' :
                     isPaused ? 'Recording paused. Click Resume to continue.' :
                     'Transcription will appear here as you speak...'}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Browser support warning */}
        {!isSupported && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-center">
            <p className="text-warning-foreground">
              Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for the best experience.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Wraps the browser's Web Speech API in a start/pause/resume/stop state
// machine, streaming interim results and emitting a final transcript on stop.
import { useRef, useState } from 'react';

// Type declarations for Web Speech API
// Augment the Window interface so TS recognizes browser-specific Webkit API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Internal state machine to manage UI and Web Speech lifecycle
export type RecordingState = 'idle' | 'recording' | 'paused';

export interface SpeechRecognitionOptions {
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingComplete: (finalTranscript: string) => void;
  onTranscriptAnalysis?: (transcript: string) => Promise<any>;
}

export const useSpeechRecognition = ({
  onTranscriptUpdate,
  onRecordingComplete,
  onTranscriptAnalysis,
}: SpeechRecognitionOptions) => {
  // Recording state drives button enablement and labels
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  // Combined interim + final transcript for display
  const [transcript, setTranscript] = useState('');
  // Human-readable error shown above controls
  const [error, setError] = useState<string>('');
  // Whether the current browser supports SpeechRecognition
  const [isSupported, setIsSupported] = useState(true);
  // Ref to the active speech recognition instance
  const recognitionRef = useRef<any>(null);
  // Accumulates all final chunks; we build the output from this + interim text
  const fullTranscriptRef = useRef('');

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and try again.');
      return false;
    }
  };

  // Initialize and start speech recognition
  const startRecording = async (isResume = false) => {
    setError('');

    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    // Request microphone permission
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setError('');
    };

    // Handle new recognition results; separate interim and final chunks
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = fullTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptText + ' ';
        } else {
          interimTranscript += transcriptText;
        }
      }

      // Persist the concatenated final transcript and combine with interim
      fullTranscriptRef.current = finalTranscript;
      const currentTranscript = (finalTranscript + interimTranscript).trim();

      setTranscript(currentTranscript);
      onTranscriptUpdate(currentTranscript);
    };

    // Surface user-friendly error messages for common failure modes
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      let errorMessage = 'An error occurred during speech recognition.';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking clearly.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow access and try again.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
      }

      setError(errorMessage);
      setRecordingState('idle');
    };

    // When the engine stops (often after a period of silence),
    // restart while in 'recording' to simulate continuous capture.
    //
    // NOTE: `recordingState` here is the value from the render that called
    // startRecording, which is never 'recording' yet — so this restart does
    // not currently fire. Kept as-is; see the refactor notes before changing,
    // because making it fire is a behavior change, not a cleanup.
    recognition.onend = () => {
      console.log('Speech recognition ended');
      if (recordingState === 'recording') {
        // Restart if we're still supposed to be recording
        setTimeout(() => {
          if (recognitionRef.current && recordingState === 'recording') {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.error('Error restarting recognition:', err);
            }
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setRecordingState('recording');

      // Only reset transcript when starting fresh (not resuming)
      if (!isResume) {
        setTranscript('');
        fullTranscriptRef.current = '';
      }
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    // Stop recognition, emit the final accumulated transcript, and reset state
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecordingState('idle');
    onRecordingComplete(fullTranscriptRef.current.trim());
  };

  const pauseRecording = async () => {
    // Pause by stopping recognition; optionally analyze the partial transcript
    if (recordingState === 'recording') {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setRecordingState('paused');

      // Analyze the current transcript segment when pausing
      const currentTranscript = fullTranscriptRef.current.trim();
      if (currentTranscript && onTranscriptAnalysis) {
        try {
          const analysisResult = await onTranscriptAnalysis(currentTranscript);
          if (analysisResult?.formattedTranscript) {
            // Update the stored transcript with the formatted version
            fullTranscriptRef.current = analysisResult.formattedTranscript;
            setTranscript(analysisResult.formattedTranscript);
            onTranscriptUpdate(analysisResult.formattedTranscript);
          }
        } catch (error) {
          console.error('Error analyzing transcript segment:', error);
        }
      }
    }
  };

  const resumeRecording = async () => {
    // Resume by starting recognition again and preserving accumulated text
    if (recordingState === 'paused') {
      setRecordingState('recording');
      await startRecording(true); // Pass true to indicate this is a resume
    }
  };

  const pauseOrResume = () => {
    // Smart toggle for the middle button (Pause ↔ Resume)
    if (recordingState === 'recording') {
      pauseRecording();
    } else if (recordingState === 'paused') {
      resumeRecording();
    }
  };

  return {
    recordingState,
    transcript,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseOrResume,
  };
};

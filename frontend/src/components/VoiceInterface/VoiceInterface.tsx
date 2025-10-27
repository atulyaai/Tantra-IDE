import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { VoiceCommandProcessor } from '../../services/voiceCommandProcessor';

interface VoiceInterfaceProps {
  onCommand?: (command: string) => void;
  onTranscript?: (transcript: string) => void;
}

export default function VoiceInterface({ onCommand, onTranscript }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [commandProcessor] = useState(() => new VoiceCommandProcessor());
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      initializeSpeechRecognition();
    } else {
      setError('Speech recognition is not supported in this browser');
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[Voice] Recognition started');
      setIsListening(true);
      setError(null);
      startVolumeMonitoring();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      
      if (onTranscript) {
        onTranscript(currentTranscript);
      }

      if (finalTranscript) {
        console.log('[Voice] Final transcript:', finalTranscript);
        if (onCommand) {
          onCommand(finalTranscript);
        }
        
        // Process the command
        const command = commandProcessor.processCommand(finalTranscript);
        if (command) {
          setIsProcessing(true);
          const success = await commandProcessor.executeCommand(command);
          if (success) {
            console.log('[Voice] Command executed successfully');
          } else {
            console.warn('[Voice] Command execution failed');
          }
          
          // Reset processing state after a delay
          setTimeout(() => {
            setIsProcessing(false);
          }, 2000);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('[Voice] Recognition error:', event.error);
      setError(`Recognition error: ${event.error}`);
      setIsListening(false);
      stopVolumeMonitoring();
    };

    recognition.onend = () => {
      console.log('[Voice] Recognition ended');
      setIsListening(false);
      stopVolumeMonitoring();
    };

    recognitionRef.current = recognition;
  };

  const startVolumeMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateVolume = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(average);
          animationRef.current = requestAnimationFrame(updateVolume);
        }
      };
      
      updateVolume();
    } catch (err) {
      console.error('[Voice] Error accessing microphone:', err);
    }
  };

  const stopVolumeMonitoring = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    setVolume(0);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('[Voice] Error starting recognition:', err);
        setError('Failed to start voice recognition');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <MicOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Voice recognition is not supported in this browser</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Voice Interface</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Click the microphone to start voice commands
        </p>
      </div>

      {/* Voice Button */}
      <div className="flex justify-center">
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            shadow-lg hover:shadow-xl
          `}
        >
          {isListening ? (
            <Mic className="w-8 h-8" />
          ) : (
            <MicOff className="w-8 h-8" />
          )}
          
          {/* Volume indicator */}
          {isListening && (
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-pulse" 
                 style={{ 
                   transform: `scale(${1 + (volume / 100)})`,
                   opacity: volume / 100 
                 }} 
            />
          )}
        </button>
      </div>

      {/* Status */}
      <div className="text-center">
        <p className={`text-sm font-medium ${
          isListening ? 'text-green-600' : 
          isProcessing ? 'text-blue-600' : 
          'text-muted-foreground'
        }`}>
          {isListening ? 'Listening...' : 
           isProcessing ? 'Processing...' : 
           'Click to start'}
        </p>
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-sm text-muted-foreground mb-1">Transcript:</p>
          <p className="text-sm">{transcript}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Voice Commands Help */}
      <div className="bg-muted/50 rounded-lg p-3">
        <h4 className="text-sm font-medium mb-2">Available Commands:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>• "Open file [name]"</div>
          <div>• "Save file"</div>
          <div>• "New file [name]"</div>
          <div>• "Run code"</div>
          <div>• "Debug code"</div>
          <div>• "Commit changes"</div>
          <div>• "Push changes"</div>
          <div>• "Search for [term]"</div>
          <div>• "AI help [question]"</div>
          <div>• "Deploy app"</div>
        </div>
      </div>
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

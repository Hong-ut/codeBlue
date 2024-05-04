import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useEffect } from 'react';

const MicButton = ({setEvents, eventsRef}) => {

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();
    

    const handleStopListening = () => {

        setEvents([...eventsRef.current, {
            type: "user",
            content: transcript
        }])
    }


    if (!browserSupportsSpeechRecognition) {
        // handle this
    }


    return (
        <div 
            className={`border-white border-2 hover:scale-105 transition-all duration-200 ease-in-out rounded-full bg-blue-700 p-10 cursor-pointer absolute bottom-5 drop-shadow-xl ${listening ? "animate-pulse" : ""}`}
            onClick={() => listening ? (SpeechRecognition.stopListening(), handleStopListening()) : (resetTranscript(), SpeechRecognition.startListening()) }
        >

            <img 
                src="/mic.svg" 
                className="size-8 invert"
            />
        
        </div>
    )
}

export default MicButton
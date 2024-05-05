import SpeechRecognition from 'react-speech-recognition';
import { useEffect } from 'react';
import callModel from '../callModel';

const MicButton = ({
    isRecording
    }) => {

    return (
        <div 
            className={`border-white border-2 hover:scale-105 transition-all duration-200 ease-in-out rounded-full bg-blue-700 p-10 cursor-pointer absolute bottom-5 drop-shadow-xl ${isRecording ? "animate-pulse" : ""} backdrop-blur-lg`}
        >

            <img 
                src="/mic.svg" 
                className="size-8 invert"
            />

        </div>
    )
}

export default MicButton
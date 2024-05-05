import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import MicButton from './MicButton';
import ScrollToBottom from 'react-scroll-to-bottom';
import callModel from '../callModel';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useImmer } from "use-immer";


const SOCKET_URL = "http://127.0.0.1:5000";


const Header = () => {
  return (
    <div className="flex items-center justify-center w-full h-24 bg-neutral-100 drop-shadow-lg absolute z-50">
      <p className="text-2xl font-bold">Coding Blue Assistant</p>
    </div>
  )
}

const Notification = ({icon, content, time}) => {
  return (
    <div className="flex space-x-3 px-3 py-2 border border-neutral-300 rounded-lg items-center w-full">
      <img className="size-4" src={icon} />

      <p className="text-sm">
        {content}
      </p>
    </div>
  )
}

const InitPrompt = () => {

  return (
    <div className="flex justify-center itmes-center px-4 py-4 border-2 border-neutral-200 drop-shadow-lg rounded-lg items-center w-full">
      <div className="hover:bg-blue-400 cursor-pointer flex justify-center items-center p-4 rounded-lg drop-shadow-lg bg-blue-700 transition-all duration-300 ease-in-out">
        <div className="rounded-full bg-blue-200"/>
        <p className="text-lg text-white">
          CODE LAUNCH
        </p>
      </div>
  </div>
  )
}

const Message = ({role, message, time}) => {

  return (
      <div className={`w-full flex ${role === "user" ? "justify-end" : "justify-start"}`}>
        <div className={`w-3/5 drop-shadow-md px-4 py-3 rounded-lg ${role === "user" ? "bg-blue-200" : "bg-blue-800 text-white"}`}>
          {message}
        </div>
      </div>
  )
}



const Chat = () => {

  const [hasInit, setHasInit] = useState(false)

  const [socket, setSocket] = useState(null);
  const [timers, setTimers] = useState({1: 0, 2: 0, 3: 0});

  const [events, setEvents] = useImmer([])




  const [isRecording, setIsRecording] = useState(false)
  const triggerWord = "coding blue"
  const stopWord = 'stop';

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
      console.log("ERRORRRRRR")
  }

  // enables listening on component mount
  useEffect(() => {
    SpeechRecognition.startListening({ continuous: true });
  }, []);


  // Effect that checks for the trigger and stop words
  useEffect(() => {

    
    // Check if the trigger word is detected
    if (transcript.toLowerCase().includes(triggerWord)) {
      console.log("RECORDING ON")
      setIsRecording(true);
      resetTranscript(); // Clear the transcript to avoid repeated triggers
    }

    // Check if the stop word is detected
    if (transcript.toLowerCase().includes(stopWord)) {

      setIsRecording(false);
      console.log("RECORDING OFF")
      let message = transcript.replace(stopWord, "")

      setEvents(draft => {
        draft.push({
          type: "user",
          content: message
        })
      })

      if (!hasInit) { // If Code Blue has not been initialized

        setEvents(draft => {
          draft.push({
            type: "assistant",
            content: "Voice input recognized. Please click Launch to proceed."
          })

          draft.push(
            {
              type: "init_prompt"
            }
          )
        })

        setHasInit(true)
  
      } else { // If it has been initialized
  
        callModel(message).then((modelResponse) => 
          
          setEvents(draft => {
            draft.push({
              type: "assistant",
              content: modelResponse 
            })
          })
        )
      }

      resetTranscript(); // Clear the transcript to avoid repeated triggers

    }

  }, [transcript, isRecording, resetTranscript]);


  
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('timer_update', (data) => {
      setTimers(prev => ({...prev, [data.timer_id]: data.time}));
    });

    return () => newSocket.close();
  }, [setSocket]);


  useEffect(() => {
    console.log(socket)
  }, [socket])


  const startTimer = async (timerId, timerType) => {
    try{
        const response = await fetch('http://127.0.0.1:5000/start_timer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timer_id: timerId, timer_type: timerType }),
        })
        const data = await response.json();
        console.log(data)
    } catch (error) {
        console.log(error)
    }
    
  };

  return (
    <div className='flex flex-col items-center h-full w-full relative'>

      <Header />
        <div className="flex flex-col space-y-10 overflow-y-scroll scrollbar-hide h-full w-full px-6 pt-36 pb-52">
          {events.map((event) => {

              if (event.type === "notification") {
                return <Notification content={event.content} icon="/alert.svg"/> 

              } else if (event.type === "init_prompt") {
                return <InitPrompt />

              } else {
                return <Message role={event.type} message={event.content} />
              }

            }
    
          )}

        </div>


      <div className="w-full bg-gradient-to-t from-blue-400 absolute bottom-0 h-36 flex justify-center" />
   
      <MicButton listening={listening} transcript={transcript} resetTranscript={resetTranscript}  />


      {/* <div>
        <button onClick={() => startTimer(1, 'CPR')}>Start CPR Timer</button>
        <p>Timer 1: {timers[1]} seconds</p>
      </div>
      <div>
        <button onClick={() => startTimer(2, 'DEFIBRILLATOR')}>Start Defibrillator Timer</button>
        <p>Timer 2: {timers[2]} seconds</p>
      </div>
      <div>
        <button onClick={() => startTimer(3, 'EPINEPHRINE')}>Start Epinephrine Timer</button>
        <p>Timer 3: {timers[3]} seconds</p>
      </div> */}


    </div>
  );
}

export default Chat;

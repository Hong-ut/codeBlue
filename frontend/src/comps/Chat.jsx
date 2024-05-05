import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import MicButton from './MicButton';
import ScrollToBottom from 'react-scroll-to-bottom';
import callModel from '../callModel';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useImmer } from "use-immer";


const SOCKET_URL = "http://127.0.0.1:5000";

const TimerDurations = {
  CPR: 120, 
  DEFIBRILLATOR: 120,  
  EPINEPHRINE: 180
}



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
     
      <div className="flex space-x-1 items-center">
        <img className="size-5" src={icon} />
        <p>
          {getTimeStringFromDate(time)}
        </p>
      </div>
   

      <p className="text-md text-neutral-500">
        {content}
      </p>

    </div>
  )
}


const InitButton = ({setHasInit}) => {

  return (
    <div className="flex justify-center itmes-center px-4 py-4 border-2 border-neutral-200 drop-shadow-lg rounded-lg items-center w-full">
      <div 
        className="hover:bg-blue-400 space-x-3 cursor-pointer flex justify-center items-center p-4 rounded-lg drop-shadow-lg bg-blue-700 transition-all duration-300 ease-in-out"
        onClick={() => {setHasInit(true)}}
     >

        <div className="rounded-full bg-blue-200 size-3 animate-pulse"/>
        <p className="text-lg text-white font-bold">
          CODE LAUNCH
        </p>
      </div>
  </div>
  )
}

const TimersDisplay = ({timerId, timerType, timers, setEvents}) => {

  const [hasStarted, setHasStarted] = useState(false)
  const hasStartedRef = useRef(hasStarted)

  useEffect(() => {

    if (hasStarted && timers[timerId] == 0) {
      setEvents(draft => {
        draft.push({
          type: "notification",
          time: Date.now(),
          icon: "/clock.svg",
          content: `${getTimeStringFromInt(TimerDurations[timerType])} of ${timerType} is up!`
        })

        if (timerType === 'CPR') {
          draft.push({
            type: "assistant",
            content: 
              <div className="flex flex-col space-y-3 items-center">
                <p>Pulse check: Is there a pulse?</p>
                <div className="flex space-x-3">
                  
                  <div 
                    className="flex justify-center hover:bg-green-400 bg-green-600 w-16 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out"
                  >
                    YES
                  </div>
                  <div 
                    className="flex justify-center hover:bg-red-400 bg-red-600 w-16 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out"
                  >
                    NO
                  </div>

                </div>
              </div>
          })
        }


      })
    }
  }, [timers[timerId]])
  

  useEffect(() => {
    const prevHasStarted = hasStartedRef.current;

    // Check if the state has transitioned from false to true
    if (!prevHasStarted && hasStarted) {
      setEvents(draft => {
        draft.push({type: "notification", time: Date.now(), icon: "/clock.svg", content: `Started ${timerType} timer.`})
      })
    }

    hasStartedRef.current = hasStarted;
  }, [hasStarted])


  return (
    <div className="flex justify-center itmes-center px-4 py-4 border-2 border-neutral-200 drop-shadow-lg rounded-lg items-center w-full">
      
      {!hasStarted ?
      <div 
        className="hover:bg-green-400 space-x-3 cursor-pointer flex justify-center items-center p-4 rounded-lg drop-shadow-lg bg-green-600 transition-all duration-300 ease-in-out"
        onClick={() => {startTimer(timerId, timerType); setHasStarted(true)}}
     >

        <img src="/clock.svg" className="invert size-5 animate-pulse"/>
        <p className="text-lg text-white font-bold">
          START {timerType} TIMER
        </p>
      </div> :

      <div className="flex justify-center items-center p-4 rounded-lg drop-shadow-lg bg-green-600">
        <p className="text-white text-lg fond-bold">
          {`${timerType} - ${getTimeStringFromInt(timers[timerId])}`}
        </p>
      </div>
      }

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


const getTimeStringFromDate = (timestamp) => {
  const date = new Date(timestamp);

  // Extract hours, minutes, and seconds
  const hours = date.getHours().toString().padStart(2, '0'); // Add leading zero if needed
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`
}

const getTimeStringFromInt = (seconds) => {
    // Calculate minutes and remaining seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    // Format minutes and seconds with leading zeros if needed
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(remainingSeconds).padStart(2, '0');

    // Construct the time string
    return `${minutesStr}:${secondsStr}`;
}


const Chat = () => {

  const [hasInit, setHasInit] = useState(false)
  const hasInitRef = useRef(hasInit)

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


  useEffect(() => {

    const prevHasInit = hasInitRef.current;

    // Check if the state has transitioned from false to true
    if (!prevHasInit && hasInit) {
      setEvents(draft => {
        const date = Date.now()
        draft.push({type: "notification", time: date, icon: "/clock.svg", content: `New code launched.`})
        draft.push({type: "timer", timerId: 1, timerType: "CPR"})
      })
    }

    hasInitRef.current = hasInit;
  }, [hasInit])




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
    if (isRecording && transcript.toLowerCase().includes(stopWord)) {

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
            content: "Voice input recognized. Please click CODE LAUNCH to proceed."
          })

          draft.push(
            {
              type: "init_prompt"
            }
          )
        })

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

  return (
    <div className='flex flex-col items-center h-full w-full relative'>

      <Header />
        <div className="flex flex-col space-y-10 overflow-y-scroll scrollbar-hide h-full w-full px-6 pt-36 pb-52">
          {events.map((event) => {

              if (event.type === "notification") {
                return <Notification content={event.content} icon={event.icon} time={event.time}/> 

              } else if (event.type === "init_prompt") {
                return <InitButton setHasInit={setHasInit}/>

              } else if (event.type === "timer") {
                return <TimersDisplay setEvents={setEvents} timers={timers} timerId={event.timerId} timerType={event.timerType} />

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

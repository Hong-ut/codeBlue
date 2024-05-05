import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import MicButton from './MicButton';
import callModel from '../callModel';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useImmer } from "use-immer";
import ProgressBar from "@ramonak/react-progress-bar";
import { useInView } from "react-intersection-observer";
import { AnimatePresence, motion } from 'framer-motion';
import { useTts } from 'tts-react'


const SOCKET_URL = "http://127.0.0.1:5000";

const TimerDurations = {
  CPR: 120, 
  DEFIBRILLATOR: 120,  
  EPINEPHRINE: 180
}


const startTimer = async (timerType) => {
  try{
      const response = await fetch('http://127.0.0.1:5000/start_timer', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timer_type: timerType }),
      })
      const data = await response.json();
      console.log(data)
  } catch (error) {
      console.log(error)
  }
};


const Header = () => {
  return (
    <div className="flex items-center justify-center w-full h-24 bg-neutral-100 drop-shadow-lg absolute z-40">
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
   
      <p className="text-md text-neutral-500 truncate max-w-52">
        {content}
      </p>

    </div>
  )
}


const InitButton = ({setHasInit, hasInit}) => {

  return (
    <div className="flex justify-center itmes-center px-4 py-4 border-2 border-neutral-200 drop-shadow-lg rounded-lg items-center w-full">
      <div 
        className="hover:bg-blue-400 space-x-3 cursor-pointer flex justify-center items-center p-4 rounded-lg drop-shadow-lg bg-blue-700 transition-all duration-300 ease-in-out"
        onClick={() => !hasInit ? setHasInit(true) : null}
     >

        <div className="rounded-full bg-blue-200 size-3 animate-pulse"/>
        <p className="text-lg text-white font-bold">
          {hasInit ? "CODE LAUNCHED" : "CODE LAUNCH"}
        </p>
      </div>
  </div>
  )
}

const MessageChoiceInput = ({message, yesAction, noAction}) => {

  const [hasClicked, setHasClicked] = useState(false);
  const [clickedOption, setClickedOption] = useState("")

  return (
    <div className="flex flex-col space-y-3 items-center">
      <p>{message}</p>
      <div className="flex space-x-3">
        
        <div 
          className={`flex justify-center bg-green-600 ${clickedOption === "yes" ? "border-white border" : ""} ${!hasClicked ? "hover:bg-green-400 cursor-pointer" : "" } w-16 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out`}
          onClick={() => {
            if (!hasClicked) {
              setHasClicked(true)
              yesAction()
              setClickedOption("yes")
            } 
          }}
       >
          YES
        </div>
        <div 
          className={`flex justify-center bg-red-600 ${clickedOption === "no" ? "border-white border" : ""} ${!hasClicked ? "hover:bg-red-400 cursor-pointer" : ""} w-16 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out`}
          onClick={() => {
            if (!hasClicked) {
              setHasClicked(true)
              noAction()
              setClickedOption("no")
            }
          }}
        >
          NO
        </div>

      </div>
    </div>
  )
}

const TimersDisplay = ({timers, timerType, randoId}) => {

  const [ping, setPing] = useState(false)

  useEffect(() => {
    if (timers[timerType] <= 15) {
      setPing(true)
    }

  }, [timers[timerType]]);

  return (
      <motion.div 
        key={timerType}
        className={`flex flex-col justify-center bg-opacity-90 border-white border-2 backdrop-blur-xl space-y-3 items-center w-full p-4 rounded-lg drop-shadow-xl bg-blue-900 ${ping && "animate-pulse"}`}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
          
      <p className="font-bold text-white">
        {timerType}
      </p>

      <div className="flex space-x-3 items-center justify-center w-full">
        <p className="text-white">{getTimeStringFromInt(timers[timerType])}</p>
        <ProgressBar height="1.5rem" className="w-full" bgColor='#3495eb' initCompletedOnAnimation={"100"} transitionTimingFunction="ease" transitionDuration={"0.5s"} isLabelVisible={false} completed={(timers[timerType] / TimerDurations[timerType]) * 100} />
      </div>

    </motion.div>
  )
}

const TimerComp = ({timerType, timers, setEvents, overrideInput=false, hiddenActiveTimers, setHiddenActiveTimers}) => {

  const [hasStarted, setHasStarted] = useState(false)
  const hasStartedRef = useRef(hasStarted)

  const [hasFinished, setHasFinished] = useState(false) // used to keep track when timer ends

  const [ping, setPing] = useState(false)


  const { ref, inView } = useInView({
    threshold: 1,
    rootMargin: "0% 0% 0% 0%",
  });


  // Handles showing hidden timers in the UI
  useEffect(() => {

    if (!hasFinished) {
      const index = hiddenActiveTimers.findIndex(obj => obj.timerType === timerType);

      if (hasStarted && !inView && index == -1 && !hasFinished) { // if the Timer is out of view and is not in the hiddenTimers, add it
        setHiddenActiveTimers(draft => {
          draft.push({
            timerType: timerType,
            randoId: Date.now()
          })
        })

      } else if ((inView && index != -1)) { 
        // if the Timer IS in view and IS in hiddenTimers OR it hasFinished and IS in hiddenTimers, remove it
        setHiddenActiveTimers(draft => {
          draft.splice(index, 1)
        })

      }
    }

  }, [inView])



  // Handles starting timer automatically if overrideInput is true
  useEffect(() => {
    if (overrideInput) {
      setHasStarted(true)
      startTimer(timerType)
    }
  }, [])



  // Handles when the timer has finished/timer is near finish
  useEffect(() => {

    if (hasStarted && timers[timerType] == 0) { // if the timer is finished
      setHasFinished(true)

      const beepAudio = new Audio(`${process.env.PUBLIC_URL}/beep.mp3`);
      beepAudio.play()

      // Cleaning up hiddenActiveTimers
      const index = hiddenActiveTimers.findIndex(obj => obj.timerType === timerType);

      if ((index != -1)) { 
        setHiddenActiveTimers(draft => {
          draft.splice(index, 1)
        })

      }

      setPing(false)

      setEvents(draft => {
        draft.push({
          type: "notification",
          time: Date.now(),
          icon: "/clock.svg",
          content: `${timerType} timer completed.`
        });

        if (timerType === 'CPR') { // Next actions after CPR Timer is finished
          draft.push({
            type: "assistant",
            content: (
              <MessageChoiceInput 
                message={"Pulse check: is there a pulse?"}

                yesAction={() => {
                  setEvents(d => {
                    d.push({type: "notification", time: Date.now(), icon: "/clock.svg", content: "Return of ROSC."})
                  })
                }}

                noAction={() => {
                  setEvents(d => {
                    d.push({type: "notification", time: Date.now(), icon: "/clock.svg", content: `Recorded no pulse.`})
                    d.push({type: "timer", timerType: "CPR", overrideInput: true})
                  })
                }}
              />
            )
          });

        } else if (timerType === "DEFIBRILLATOR") { // Next actions after defilbrillator is finished
          draft.push({
            type: "assistant",
            content: (
              <MessageChoiceInput 
                message={"Shock again (only for VF/pVT)?"} 
                yesAction={() => {
                  setEvents(d => {
                    d.push({type: "notification", time: Date.now(), icon: "/clock.svg", content: `Shocked patient.`})
                    d.push({type: "timer", timerType: "DEFIBRILLATOR", overrideInput: true})
                  })
                }}

                noAction={() => {
                  setEvents(d => {
                    d.push({type: "notification", time: Date.now(), icon: "/clock.svg", content: `Not VF/pVT.`})
                  })
                }}
              />
            )
          });
 
        } else if (timerType === "EPINEPHRINE") { // Next actions after Epineprhine is finished
          draft.push({
            type: "assistant",
            content: "Epinephrine countdown complete. Can give 2nd IV Epi dose"
          });
        }
      });

    } else if (hasStarted && timers[timerType] == 15) { // If timer is 15 seconds, enable pulse animation
      setPing(true)
    }

  }, [timers[timerType]]);
  
  
  // When the timer has started log as a notification
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
    <div ref={ref} className={`flex justify-center itmes-center px-4 py-4 border-2 border-neutral-200 drop-shadow-lg rounded-lg items-center w-full`}>
      
      {!hasStarted ?
      <div 
        className="hover:bg-blue-700 space-x-3 cursor-pointer flex justify-center items-center p-4 rounded-lg drop-shadow-lg bg-blue-900 transition-all duration-300 ease-in-out"
        onClick={() => {startTimer(timerType); setHasStarted(true)}}
     >

        <img src="/clock.svg" className="invert size-5 animate-pulse"/>
        <p className="text-lg text-white font-bold">
          START {timerType} TIMER
        </p>
      </div> :

      <div className={`flex flex-col justify-center space-y-3 items-center w-full p-4 rounded-lg drop-shadow-lg bg-blue-900 ${ping && "animate-pulse"}`}>
        
        <p className="font-bold text-white">
          {timerType}
        </p>

        <div className="flex space-x-3 items-center justify-center w-full">
          <p className="text-white">{`${!hasFinished ? getTimeStringFromInt(timers[timerType]) : "00:00"}`}</p>
          <ProgressBar height="1.5rem" className="w-full" bgColor='#3495eb' initCompletedOnAnimation={"100"} transitionTimingFunction="ease" transitionDuration={"0.5s"} isLabelVisible={false} completed={hasFinished ? 0 : (timers[timerType] / TimerDurations[timerType]) * 100} />
        </div>

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
  const [timers, setTimers] = useState({});

  const [events, setEvents] = useImmer([])

  const [isRecording, setIsRecording] = useState(false)
  const triggerWord = "coding blue"
  const stopWord = 'stop';


  const [hiddenActiveTimers, setHiddenActiveTimers] = useImmer([])

  const eventsContainerRef = useRef(null);


  // makes chat auto scroll to the bottom
  useEffect(() => {
    const eventsContainer = eventsContainerRef.current;
    if (eventsContainer) {
      eventsContainer.scrollTo({
        top: eventsContainer.scrollHeight,
        behavior: 'smooth' // This will enable smooth scrolling
      });
    }
  }, [events]);


  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
      console.log("ERRORRRRRR")
  }

  // Handles whether or not we've inited :D
  useEffect(() => {

    const prevHasInit = hasInitRef.current;

    // Check if the state has transitioned from false to true
    if (!prevHasInit && hasInit) {
      setEvents(draft => {
        const date = Date.now()
        draft.push({type: "notification", time: date, icon: "/clock.svg", content: `New code launched.`})
        draft.push({type: "timer", timerType: "CPR", overrideInput: false})
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
        
        callModel(message).then((modelCallResult) => 
          
          setEvents(draft => {
            draft.push({
              type: "notification",
              time: Date.now(),
              icon: "/clock.svg",
              content: modelCallResult.logMessage
            });            
            
            draft.push({type: "timer", timerType: modelCallResult.tool, overrideInput: true})
          
          })
        )
      }

      resetTranscript(); // Clear the transcript to avoid repeated triggers

    }

  }, [transcript, isRecording, resetTranscript]);


  // updating sockets
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('timer_update', (data) => {
      setTimers(prev => ({...prev, [data.timer_type]: data.time}));
    });

    return () => newSocket.close();
  }, [setSocket]);


  return (
    <div className='flex flex-col items-center h-full w-full relative'>

      <Header />

      <div className="w-full px-5 fixed top-0 mt-28 flex-col space-y-5 justify-center z-50">
        <AnimatePresence>
        {hiddenActiveTimers.map((timer, idx) => 
          <TimersDisplay key={timer.randoId} timers={timers} timerType={timer.timerType} randoId={timer.randoId} />
        )}
        </AnimatePresence>
      </div>
     
        <div ref={eventsContainerRef} className="flex flex-col space-y-10 overflow-y-scroll scrollbar-hide h-full w-full px-6 pt-36 pb-52">
          {events.map((event, idx) => {

              if (event.type === "notification") {
                return <Notification key={idx} content={event.content} icon={event.icon} time={event.time}/> 

              } else if (event.type === "init_prompt") {
                return <InitButton key={idx} setHasInit={setHasInit} hasInit={hasInit}/>

              } else if (event.type === "timer") {
                return <TimerComp hiddenActiveTimers={hiddenActiveTimers} setHiddenActiveTimers={setHiddenActiveTimers} key={idx} overrideInput={event.overrideInput} setEvents={setEvents} timers={timers} timerType={event.timerType} />

              } else {
                return <Message key={idx} role={event.type} message={event.content} />
              }
            }
          )}

        </div>


      <div className="w-full bg-gradient-to-t from-blue-400 absolute bottom-0 h-36 flex justify-center" />
      
      <MicButton isRecording={isRecording}  />

    </div>
  );
}

export default Chat;

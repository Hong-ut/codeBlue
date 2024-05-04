import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import MicButton from './MicButton';
import ScrollToBottom from 'react-scroll-to-bottom';

const SOCKET_URL = "http://127.0.0.1:5000";


const Header = () => {
  return (
    <div className="flex items-center justify-center w-full h-24 bg-neutral-100 drop-shadow-lg absolute z-50">
      <p className="text-2xl font-bold">Code Blue Assistant</p>
    </div>
  )
}

const Notification = ({icon, content, time}) => {
  return (
    <div className="flex space-x-3 px-4 py-3 bg-blue-400 items-center rounded-lg w-full drop-shadow-md">
      <img className="size-4 invert" src={icon} />

      <p className="text-md text-white">
        {content}
      </p>
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
  const [socket, setSocket] = useState(null);
  const [timers, setTimers] = useState({1: 0, 2: 0, 3: 0});

  const [events, setEvents] = useState([{type: "notification", content: "ALERT ALERT"}, {type: "user", content: "Hi there"}, {type: "assistant", content: "How can I help?"}])
  const eventsRef = useRef(events)

  useEffect(() => {
    eventsRef.current = events
  }, [events])

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    console.log(socket)
    setSocket(newSocket);

    newSocket.on('timer_update', (data) => {
    console.log(data)
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

      {/* <div className="w-full h-full"> */}
        {/* <ScrollToBottom> */}

          <div className="flex flex-col space-y-10 overflow-y-scroll h-full w-full px-6 pt-36 pb-52">
            {events.map((event) => 
              event.type === "notification" ?
              <Notification content={event.content} icon="/alert.svg"/> :
              <Message role={event.type} message={event.content} />
            )}

          </div>

        {/* </ScrollToBottom>
      </div> */}


      <div className="w-full bg-gradient-to-t from-blue-400 absolute bottom-0 h-60 flex justify-center">
      </div>
      <MicButton setEvents={setEvents} eventsRef={eventsRef} />

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

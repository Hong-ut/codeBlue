import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = "http://127.0.0.1:5000";

function App() {
  const [socket, setSocket] = useState(null);
  const [timers, setTimers] = useState({1: 0, 2: 0, 3: 0});

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
    <div className='flex flex-col'>
      <h1 className='text-3xl font-bold'>Timer App</h1>
      <div>
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
      </div>
    </div>
  );
}

export default App;

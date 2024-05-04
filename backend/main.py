"""
READ THE readme.md please
"""

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import threading
import time
import eventlet
import cohere
import os
from dotenv import load_dotenv, dotenv_values


load_dotenv()

# THIS LINE IS NEEDED. LITERALLY WASTED AN HOUR WITH MULTITHREADING/SOCKETIO bug without this line
eventlet.monkey_patch()

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)
timers = {}
timer_threads = {}
timer_lock = threading.Lock()

TIMER_DURATIONS = {
    'CPR': 120,  # 2 minutes
    'DEFIBRILLATOR': 120,  # 2 minutes
    'EPINEPHRINE': 180  # 3 minutes
}


co = cohere.Client(os.getenv("COHERE_API_KEY"))


# {user_id: {CPR: 110, ...}}
# ex: {1: {'CPR': 95}}
user_timers = {}

def timer_task(timer_id, user_id, timer_type):
    """Function to run as a thread to handle timer counting."""
    duration = TIMER_DURATIONS[timer_type]
    with timer_lock:
        timers[timer_id] = duration  
    
    while duration > 0:
        with timer_lock:
            if timers[timer_id] is None:
                break  
            timers[timer_id] -= 1
            duration = timers[timer_id]
        if user_id in user_timers:
            user_timers[user_id][timer_type] = duration
        else:    
            user_timers[user_id] = {timer_type: duration}
        print(user_timers)

        socketio.emit('timer_update', {'timer_id': timer_id, 'time': duration})

        time.sleep(1)

    with timer_lock:
        timers.pop(timer_id, None)
        timer_threads.pop(timer_id, None)

@app.route('/start_timer', methods=['POST'])
def start_timer():
    # user_id=1 for now since we don't have auth 
    user_id = 1
    timer_id = request.json.get('timer_id')
    timer_type = request.json.get('timer_type')
    socketio.emit('timer_update', {'data': 'test'})
    if timer_id is None or not isinstance(timer_id, int) or timer_id < 1 or timer_id > 3:
        return {'error': 'Invalid timer ID'}, 400
    if timer_type not in TIMER_DURATIONS:
        return {'error': 'Invalid timer type'}, 400

    with timer_lock:
        if timer_id in timers and timers[timer_id] is not None:
            return {'error': 'Timer already running'}, 400
        
        # Start a new timer thread
        thread = threading.Thread(target=timer_task, args=(timer_id, user_id, timer_type))
        # socketio.start_background_task(timer_task, timer_id, user_id, timer_type)

        thread.daemon = True
        thread.start()
        timer_threads[timer_id] = thread  # Store thread for potential management
    
    return {'message': 'Timer started'}, 200


@app.route('/model_call', methods=['POST'])
def model_call():

    chat_history = request.json.get('chat_history')
    prompt = request.json.get('prompt')

    try:

        response = co.chat(
            chat_history=chat_history,
            message=prompt,
        )

        print(response)

        model_response = response.text
        return jsonify({"response": model_response}), 200

    except Exception as e:
        return jsonify(e), 400


# 
def tool_use(prompt):
    """
    use tool use to decide which action to take. 
    actions = ['epi_timer', 'DEFIBRILLATOR_timer']
    
    ex: 
    prompt="200J given on biphasic debrillator"
    => ideal_action: start the DEFIBRILLATOR_timer, and record the action 
    """
    # REMINDER: CPR timer starts after user makes a click. So no tool use needed for the CPR timer


if __name__ == '__main__':
    socketio.run(app, debug=True)

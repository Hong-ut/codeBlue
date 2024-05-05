"""
READ THE readme.md please
"""

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import time
import cohere
import os
import eventlet
from dotenv import load_dotenv, dotenv_values
from tools import tools, FUNCTIONS_MAP, get_few_shot_prompt
from threads import timer_lock, start_timer_thread

load_dotenv()

# THIS LINE IS NEEDED. LITERALLY WASTED AN HOUR WITH MULTITHREADING/SOCKETIO bug without this line
# UPDATE: for some reason, we need to disable it now after splitting threads into a diff file
eventlet.monkey_patch()

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)
timers = {}

TIMER_DURATIONS = {
    'CPR': 120,  # 2 minutes
    'DEFIBRILLATOR': 120,  # 2 minutes
    'EPINEPHRINE': 180  # 3 minutes
}


co = cohere.Client(os.getenv("COHERE_API_KEY"))


# {user_id: {CPR: 110, ...}}
# ex: {1: {'CPR': 95}}
user_timers = {}

def timer_task(user_id, timer_type):
    """Function to run as a thread to handle timer counting."""
    print('testtttttt================')
    print(user_id)
    print(timer_type)
    duration = TIMER_DURATIONS[timer_type]
    with timer_lock:
        print(user_timers)
        if user_id in user_timers:
            user_timers[user_id][timer_type] = duration
        else:    
            user_timers[user_id] = {timer_type: duration}
    print(f'duration: {duration}')
    while duration > 0:
        with timer_lock:
            if user_timers[user_id][timer_type] is None:
                break  
            user_timers[user_id][timer_type] -= 1
            duration = user_timers[user_id][timer_type]
        print(user_timers)

        socketio.emit('timer_update', {'timer_type': timer_type, 'time': duration})

        time.sleep(1)

    with timer_lock:
        user_timers[user_id].pop(timer_type)


@app.route('/start_timer', methods=['POST'])
def start_timer():
    # user_id=1 for now since we don't have auth 
    user_id = 1
    timer_type = request.json.get('timer_type')
    socketio.emit('timer_update', {'data': 'test'})
    if timer_type not in TIMER_DURATIONS:
        return {'error': 'Invalid timer type'}, 400

    with timer_lock:
        if user_id in user_timers and timer_type in user_timers[user_id]:
            return {'error': 'Timer already running'}, 400
        
        # Start a new timer thread
        start_timer_thread(user_id, timer_type, timer_task)
    
    
    return jsonify({'message': 'Timer started'}), 200




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


@app.route('/tool_use_timer', methods=['POST'])
def tool_use_timer():
    """
    use tool use to decide which action to take. 
    actions = ['epi_timer', 'DEFIBRILLATOR_timer']
    
    ex: 
    prompt="200J given on biphasic debrillator"
    => ideal_action: start the DEFIBRILLATOR_timer, and record the action 
    """
    try:
        preamble = """
            ## Task & Context
            You help people decide which countdown timer to execute based on the given prompt. 
        """
        prompt = request.json.get('prompt')
        prompt = get_few_shot_prompt(prompt)
        response = co.chat(
            message=prompt,
            tools=tools,
            preamble=preamble,
            model="command-r"
        )
        for tool_call in response.tool_calls:
            # activate the appropriate timer based on the prompt
            print(tool_call.name)
            print(FUNCTIONS_MAP[tool_call.name])
            # user_id, timer_type, task_function
            params = {'task_function': timer_task}
            FUNCTIONS_MAP[tool_call.name](**params)

        return jsonify({'message': f"{tool_call.name} Executed"}), 200

    except Exception as e:
        return jsonify(e), 400

if __name__ == '__main__':
    socketio.run(app, debug=True)

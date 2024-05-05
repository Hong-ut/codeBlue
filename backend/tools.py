from threads import timer_lock, start_timer_thread

# # Tools
def start_DEFIBRILLATOR_timer(task_function):
    user_id = 1
    timer_type = 'DEFIBRILLATOR'
    with timer_lock:
        start_timer_thread(user_id, timer_type, task_function)

def start_EPINEPHRINE_timer(task_function):
    user_id = 1
    timer_type = 'EPINEPHRINE'
    with timer_lock:
        start_timer_thread(user_id, timer_type, task_function)

FUNCTIONS_MAP = {
    'start_DEFIBRILLATOR_timer': start_DEFIBRILLATOR_timer,
    'start_EPINEPHRINE_timer': start_EPINEPHRINE_timer
}

tools = [
    {
        "name": "start_DEFIBRILLATOR_timer",
        "description": "Initiates the countdown timer for administering the subsequent electrical shock using a defibrillator.",
        "parameter_definitions": {
        }
    },
    {
        "name": "start_EPINEPHRINE_timer",
        "description": "Begins the countdown timer for the next scheduled administration of an epinephrine injection.",
        "parameter_definitions": {
        }
    }
]

def get_few_shot_prompt(prompt):
    # User request using structured input
    prompt = f"""Based on the medical prompt provided in the prompt, select the appropriate countdown timer to activate.

    prompt: '160J given on biphasic defibrillator'
    output: 'start_DEFIBRILLATOR_timer'

    prompt: 'Epinephrine IV 1 mg given'
    output: 'start_EPINEPHRINE_timer'

    prompt: '{prompt}'
    output:
    """
    return prompt

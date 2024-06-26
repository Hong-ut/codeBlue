from dotenv import load_dotenv, dotenv_values
import cohere
import os
from main import timer_lock, start_timer_thread

load_dotenv()

co = cohere.Client(os.getenv("COHERE_API_KEY"))

# tools
def start_DEFIBRILLATOR_timer():
    print('test: DEF')
    user_id = 1
    timer_type = 'DEFIBRILLATOR'
    with timer_lock:
        start_timer_thread(user_id, timer_type)
        
def start_EPINEPHRINE_timer():
    print('test: EPI')
    user_id = 1
    timer_type = 'EPINEPHRINE'
    with timer_lock:
        start_timer_thread(user_id, timer_type)
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
preamble = """
## Task & Context
You help people decide which countdown timer to execute based on the given prompt. 

"""

prompt = "some epi given"

# User request using structured input
message = f"""Based on the medical prompt provided in the prompt, select the appropriate countdown timer to activate.

prompt: '160J given on biphasic defibrillator'
output: 'start_DEFIBRILLATOR_timer'

prompt: 'Epinephrine IV 1 mg given'
output: 'start_EPINEPHRINE_timer'

prompt: '{prompt}'
output:
"""

response = co.chat(
   message=message,
   tools=tools,
   preamble=preamble,
   model="command-r"
)

print("\n".join(str(tool_call) for tool_call in response.tool_calls))
print(response.tool_calls[0])

tool_results = []
# Iterate over the tool calls generated by the model
for tool_call in response.tool_calls:
   # here is where you would call the tool recommended by the model, using the parameters recommended by the model
   print(tool_call.parameters)
#    FUNCTIONS_MAP[tool_call.name](**tool_call.parameters)
   # store the output in a list
   

print(tool_results)
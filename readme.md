
# BACKEND:
## timers 
## tool-use to decide which timer to activate from the prompt (-- CPR timer starts from the user's click though)
### Actions from tool-use
- initial activation
- activate epi or defi timer

# FRONTEND:
## always listen for voice output
- when "CODING BLUE" is detected, send the first 2? sentences to the backend for tool-use action 
- initial activation when user says smth like "CodingBlue Activate" (via tool-use)
- => following the initial activation, prompt the user with "START CPR" button. when clicked, start the CPR timer
- basically implement everything mentioned above through "start_timer" action & prompting user with something when the timer ends (which leads to either resetting the timer or some other simple action)



### There are 3 roles in the chat system:
- user
- assistant
- notification
### Activation Phase 1 via keyword "Hello CodingBlue" in the prompt
=> output: activation message + show 

1. speech output: "START CPR" & **PROMPT** ("START CPR") => start CPR timer
- after every 2 mins (timer ends): **PROMPT**: "Pulse check. Is there a pulse?" 
    - Pulse Present => end with ROSC 
    - Pulse Absent => reset CPR timer


2. start DEFIBRILLATOR timer (2 mins) when DEFIBRILLATOR prompt is given (ex: "200J given on biphasic debrillator") given (**use Tool use to detect such DEFIBRILLATOR-related prompt**) => start DEFIBRILLATOR timer (2 mins)
- after every 2 mins (timer ends): **PROMPT**: 
"DEFIBRILLATOR TIMER ended. If VF or pVT, Shock Again" 
    - 'not VF/pVT' => Don't reset the timer. But the timer will reset to 2 mins if user gives another prompt like "160J given on biphasic debrillator" LATER
    - 'SHOCKED' => Reset the timer to 2 mins


3. **start epi timer when "epi" PROMPT is given (Tool use to detect)** (3 mins)
- when the epi timer ends, voice output "Epinephrine countdown complete. Can give 2nd IV Epi dose"
- **RESET THE TIMER WHEN "epi" PROMPT is given**
- also display total epi dosage at the bottom



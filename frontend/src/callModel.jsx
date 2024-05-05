const toolNameMap = {
    start_DEFIBRILLATOR_timer: "DEFIBRILLATOR",
    start_EPINEPHRINE_timer: "EPINEPHRINE"
}



const callModel = async (prompt, chatHistory=[]) => {

    try {

        const response = await fetch('http://127.0.0.1:5000/tool_use_timer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt, chat_history: chatHistory }),
        })

        const data = await response.json();

        return {tool: toolNameMap[data.tool], logMessage: data.log_message}

    } catch (error) {
        return error.toString()
    }
        

}

export default callModel
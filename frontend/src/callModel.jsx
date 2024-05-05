
const callModel = async (prompt, chatHistory=[]) => {

    try {

        const response = await fetch('http://127.0.0.1:5000/model_call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt, chat_history: chatHistory }),
        })

        const data = await response.json();
        return data.response

    } catch (error) {
        return error.toString()
    }
        

}

export default callModel
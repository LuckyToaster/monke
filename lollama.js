class Lollama {
    static model = 'llama3.2:3b-instruct-q5_K_M'
    static _url = 'http://127.0.0.1:11434/api/'
    static _reqData = {
        method: 'POST', 
        headers: {'Content-Type': 'Application/json'}, 
        body: null  
    }

    static tokensPerSecond(response) {
        return (response.eval_count / response.eval_duration * 10e9).toFixed(2)
    }

    static filterThinking(text) {
        const str = new String(text)
        return str.replace(str.match(/<think>[\s\S]*?<\/think>/g), '').trim()
    }

    static async getModels() {
        return await fetch(`${Lollama._url}tags`).then(r => r.json()).then(j => j.models)
    }

    static async chat(prompt) {
        Lollama._reqData.body = JSON.stringify({model: Lollama.model, prompt: prompt, stream: false, timeout: 600000})
        return await fetch(`${Lollama._url}generate`, Lollama._reqData).then(r => r.json())
    }

    static async chatStreaming(prompt, cb) {
        Lollama._reqData.body = JSON.stringify({model: Lollama.model, prompt: prompt})
        const res = await fetch(`${Lollama._url}generate`, Lollama._reqData)
        if (!res.ok) throw new Error(`SHOOT!: ${res.status}`)

        let dec = new TextDecoder()
        for await (const chonker of res.body)
            cb(JSON.parse(dec.decode(chonker)))
    }
}

module.exports = { Lollama }

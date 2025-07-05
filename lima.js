/*
    All the attributes and methods of this class are static
        - It should be used like a static class
        - It should never be instantiated (it is not a singleton, it is a static class)
*/
class Lima {
    static dec = new TextDecoder()
    static model = 'deepseek-r1:7b' // 'llama3.2:3b-instruct-q5_K_M'
    static url = 'http://127.0.0.1:11434/api/'
    static reqData = {
        method: 'POST', 
        headers: {'Content-Type': 'Application/json'}, 
        body: null
    }

    // pass a response from chat method, OR pass the last chunk yielded by ChatStreaming method
    static tokensPerSecond(response) {
        return (response.eval_count / response.eval_duration * 10e9).toFixed(2)
    }

    // use this to decode chunks yielded by ChatStreaming method
    static chunkToJson(chunk) {
        return JSON.parse(Lima.dec.decode(chunk))
    }

    static filterThinking(text) {
        const str = new String(text)
        return str.replace(str.match(/<think>[\s\S]*?<\/think>/g), '').trim()
    }

    static async getModels() {
        return await fetch(`${Lima.url}tags`).then(r => r.json()).then(j => j.models)
    }

    static async chat(prompt) {
        Lima.reqData.body = JSON.stringify({ model: Lima.model, prompt: prompt, stream: false })
        return await fetch(`${Lima.url}generate`, Lima.reqData).then(r => r.json())
    }

    static async chatStreaming(prompt, cb) {
        Lima.reqData.body = JSON.stringify({ model: Lima.model, prompt: prompt })
        const res = await fetch(`${Lima.url}generate`, Lima.reqData)
        if (!res.ok) throw new Error(`SHOOT!: ${res.status}`)

        if (cb && typeof cb === 'function') for await (const chonker of res.body) cb(chonker)
        else return async function* asyncGenerator() {
            for await (const chonker of res.body) yield chonker
        }() 
    }
}

module.exports = { Lima } 

// LIMA EXAMPLE USAGE
/*
(async () => {
    // listing models example
    const models = await Lima.getModels()
    models.forEach(m => console.log(m.model))

    // chat example
    const res = await Lima.chat('tell me a dad joke')
    console.log(res.response)
    console.log(Lima.tokensPerSecond(res) + ' tokens per second')

    // changing models and filtering thinking example
    Lima.model = models[0].model // deepseek 1.5b
    const res2 = await Lima.chat('what is 2+2?') 
    console.log(Lima.filterThinking(res2.response))
    Lima.model = models[2].model // llama3.2 3b

    // Using 'for await' syntax
    for await (const chunk of await Lima.chatStreaming('tell me a funny joke')) 
        process.stdout.write(Lima.chunkToJson(chunk).response)

    // Using callback syntax
    await Lima.chatStreaming('why is the sky blue', (c) => {
        c = Lima.chunkToJson(c)
        if (c.eval_count) console.log(`\n${Lima.tokensPerSecond(c)} Tokens per second`)
        else process.stdout.write(c.response)
    })
})()
*/


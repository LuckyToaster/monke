const { createInterface } = require("readline/promises")
const { execSync, exec } = require('child_process')
const { writeFileSync } = require('fs')
const ora = require('ora');
const { Lollama } = require('./lollama');


(async () => {
    const models = await Lollama.getModels()
    const rl = createInterface({input: process.stdin, output: process.stdout});

    if (process.argv.length == 3 && !isNaN(parseInt(process.argv[2])) && parseInt(process.argv[2]) < models.length)
        Lollama.model = models[parseInt(process.argv[2])].name
    else {
        console.log() 
        Array.from(models.entries()).forEach(([i, m]) => console.log(`\t🐒 ${i} 🧠 ${m.name} `))
        console.log() 

        let n = null
        do n = await rl.question(`💲🐒❓👉 `).then(str => parseInt(str)).then(n => isNaN(n)? null: n)
        while (n == null || n >= models.length || n < 0)

        Lollama.model = models[n].name 
    }

    let prompt = null 
    do prompt = await rl.question(`💲🍌❓👉 `)
    while (!prompt || !prompt.trim())
    rl.close()

    const start = Date.now()
    let res = null
    let spin = ora({prefixText: '💲🐒🧠', color: 'green', spinner: 'binary'}).start() // sand, binary, bouncingBar, monkey, hearts, clocks, grenade, weather, moon, material, fingerDace, fistBump, mindblown, soccerHeader

    try { 
        res = await Lollama.chat(prompt) 
    } catch (e) { 
        console.error(e.message) 
    }

    spin.stop({indent: 0})

    let time = (Date.now() - start) / 1000
    if (time > 60) time =  (time/60).toFixed(2) + ' minutes'
    else time = parseInt(time) + ' seconds'

    writeFileSync(`${__dirname}/assets/lol.html`, make_html(Lollama.filterThinking(res.response)))
    execSync(`brave-browser ${__dirname}/assets/lol.html`, {detached: true, stdio: 'ignore'})
    exec(`aplay -q ${__dirname}/assets/excited_monkey.wav`)

    console.log(`💲 ${Lollama.tokensPerSecond(res)} 🍌×s⁻¹ 🙉\n💲 ${time} 🙉`)
})()


const make_html = (res) => `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>Monke</title>
    <link rel="icon" type="image/svg+xml" href="banana.svg">
    <style>
        body { background-color: #121212; color: #e0e0e0; margin: 1rem 2rem 1rem 2rem; }
        .light-mode { background-color: #ffffff; color: #000000; }
        button:hover { background-color: #666; }
        button { float: right; padding: 0.5rem 0.75rem; margin: 0 0 1rem 1rem; background-color: #444; color: #fff; border: none; cursor: pointer; border-radius: 0.5rem; font-size: x-large; }
    </style>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
    <button id='buttonerino' onclick="toggle()">🌞</button>
    <p>${res}</p>
    <script> 
        const toggle = () => { 
            document.body.classList.toggle('light-mode'); 
            let btn = document.getElementById('buttonerino'); 
            btn.textContent === '🌜' ? btn.textContent = '🌞': btn.textContent = '🌜'; 
        }
        document.addEventListener('keydown', (event) => { if (event.code === 'Space') toggle() })
    </script>
</body>
</html>`



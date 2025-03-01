const { createInterface } = require("readline/promises")
const { exec } = require('child_process')
const { promisify } = require('util');
const { writeFile } = require('fs/promises')
const execAsync = promisify(exec)
const ora = require('ora');
const { Lollama } = require('./lollama');
//const trucolor = (r,g,b) => `\x1b[38;2;${r};${g};${b}m`
const GAYSHIT = ['\x1b[38;2;255;0;0m', '\x1b[38;2;255;255;0m', '\x1b[38;2;0;255;0m', '\x1b[38;2;0;255;255m', '\x1b[38;2;0;0;255m', `\x1b[38;2;255;0;255m`]
const RES = '\x1b[0m', PINK = '\x1b[35m', CYAN = '\x1b[36m'

const MODEL = PINK + 'Select model => ' + CYAN
const MATH = PINK + 'Math Question? (y/n) => ' + CYAN
const PROMPT = PINK + 'Enter prompt => ' + CYAN
const LOADING = PINK + 'Generating response...' + RES
const PLSMATH = 'Please generate the response in LaTex (no markdown)'

const STARTLATEX = '\\documentclass[14pt]{article}\n\\usepackage{amsmath, amssymb}\n\\usepackage[left=1cm, right=1cm, top=1cm, bottom=1cm]{geometry}\n\\begin{document}\n\\begin{Large}\n'
const ENDLATEX = '\n\\end{Large}\n\\end{document}'
const ASSETS = __dirname + '/assets'
const TEXFILE = ASSETS + '/file.tex';


(async () => {
    const models = await Lollama.getModels()
    Array.from(models.entries()).forEach(([i, m]) => console.log(`\t${GAYSHIT[i%6]}${i}: ${PINK}${m.name}`))

    const rl = createInterface({input: process.stdin, output: process.stdout})
    let n = null
    do n = await rl.question(MODEL).then(s => parseInt(s)).then(n => !isNaN(n)? n: null)
    while (n == null || n >= models.length || n < 0)

    let math = null
    do math = await rl.question(MATH).then(s => s.trim().toLowerCase()).then(r => r === 'y'? true : r === 'n'? false : null) 
    while (math == null)

    const prompt = await rl.question(PROMPT)
    if (!prompt.trim()) return
    rl.close()

    Lollama.model = models[n].name 

    let spin = ora({text: LOADING, color: 'cyan'}).start()
    const res = await Lollama.chat(prompt)
    const response = Lollama.filterThinking(res.response)
    spin.stop()

    if (math) {
        await writeFile(TEXFILE, STARTLATEX + response + PLSMATH + ENDLATEX)
        const {out, err} = await execAsync(`pdflatex --output-directory ${ASSETS} ${TEXFILE}`)
        if (err) {
            console.error(err)
            process.exit(1)
        }
        await execAsync(`brave-browser ${ASSETS}/file.pdf`, {detached: true, stdio: 'ignore'})
    } else console.log(response) 

    await execAsync(`aplay ${ASSETS}/sound.wav`)
    console.log(`${PINK}${Lollama.tokensPerSecond(res)} tokens per second${RES}`)
})()


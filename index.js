const express = require('express')
const app = express()
const favicon = require('serve-favicon')
const port = process.env.PORT

app.use(favicon(`${__dirname}/assets/favicon.png`))
app.use('/assets', express.static(`${__dirname}/assets`));

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`)
})

app.listen(port, () => {
    console.log(`Weyland-Yutani IO system listening on ${port}`)
})
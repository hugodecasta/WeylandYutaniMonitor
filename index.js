const express = require('express')
const app = express()
const port = process.env.PORT

app.get('/', (req, res) => {
    res.send('<h1>Weyland-Yutani communication system<h1><br><h2>Comming soon !!!<h2>')
})

app.listen(port, () => {
    console.log(`Weyland-Yutani IO system listening on ${port}`)
})
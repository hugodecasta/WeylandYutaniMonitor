const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http);
const fs = require('fs')
const favicon = require('serve-favicon')

const core = require('./core')

// --------------------------------------------------------------------- INIT

core.core_init(io)

// --------------------------------------------------------------------- DATA

const port = process.env.PORT

// --------------------------------------------------------------------- USES

app.use(favicon(`${__dirname}/assets/favicon.png`))
app.use('/assets', express.static(`${__dirname}/assets`));

// --------------------------------------------------------------------- INDEX

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`)
})

// --------------------------------------------------------------------- API

// ---------------------------------------------------------------------

http.listen(port, () => {
    console.log(`Weyland-Yutani IO system listening on ${port}`)
})
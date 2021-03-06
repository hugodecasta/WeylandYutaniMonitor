const { encrypt, decrypt } = require('@rlvt/crypt')
const { TIMEOUT } = require('dns')
const uuid = require('uuid').v4
const fs = require('fs')

// ---------------------------------------------------------- DATA

const base_dir = `${__dirname}/base`
var io = null
const DEBUG = process.env.DEBUG == 'true'
const response_to = DEBUG ? 0 : 2000

const system_beam_ids = { beam_name: 'SYS-BEAM', beam_code: process.env.SYS_BEAM_CODE, personal_id: 'BEAM-SYSTEM' }
console.log('system_beam_ids', system_beam_ids)

// ---------------------------------------------------------- IO SYSTEM

// ------------------ REQUESTS

let requests = {
    'version': async () => JSON.parse(await fs.promises.readFile(`${__dirname}/package.json`)).version,
    'beam_secret': async ({ beam_name, beam_code }) => beam_secret(beam_name, beam_code),
    'load_beam_file': async ({ beam_name, beam_code }) => await load_beam_file(beam_name, beam_secret(beam_name, beam_code)),
    'load_beam_new_messages': async ({ beam_name, beam_code, start_date }) =>
        (await load_beam_file(beam_name, beam_secret(beam_name, beam_code)))
            .filter(message_data => message_data.date > start_date),
    'search_in_beam': async ({ beam_name, beam_code, query }) => await search_in_beam(beam_name, beam_code, query),
    'send_message': async ({ beam_name, beam_code, personal_id, message }) => {
        let message_data = await save_message(beam_name, beam_code, personal_id, message)
        await send_to_beam(beam_name, beam_code, personal_id, message, message_data.date)
        return message_data
    }
}

// ------------------ INIT

var all_sockets = []

function init_io(io_engine) {
    io = io_engine
    io.on('connection', (socket) => {
        all_sockets.push(socket)
        socket.on('disconnect', () => {
            all_sockets.splice(all_sockets.indexOf(socket), 1)
        })
        socket.on('request', async ({ name, data, response_code }) => {
            if (name in requests) {
                const begin = Date.now()
                const response = await requests[name](data, socket)
                const end = Date.now()
                const time_spent = end - begin
                const remaining_time = response_to - time_spent
                const time_to_send = Math.max(0, remaining_time)
                setTimeout(async () => socket.emit('request_response_' + response_code, response), time_to_send)
            }
            else {
                socket.emit('request_response_' + response_code, { error: 'request does not exist' })
            }
        })
    })
}

// ------------------ SYSTEM LOG

function sys_log(message) {
    let { beam_name, beam_code, personal_id } = system_beam_ids
    send_to_beam(beam_name, beam_code, personal_id, message, Date.now())
    save_message(beam_name, beam_code, personal_id, message, true)
}

// ------------------ SEND TO

function send_to_beam(beam_name, beam_code, personal_id, message, date = Date.now()) {
    let secret = beam_secret(beam_name, beam_code)
    all_sockets.forEach(socket => socket.emit(secret, { date, personal_id, message }))
}

// ---------------------------------------------------------- BASE METHODS

// ------------------ FILE

async function load_file(name, secret) {
    const filename = encrypt(name, secret)
    const path = `${base_dir}/${filename}`
    if (!fs.existsSync(path)) return null
    const enc_data = await fs.promises.readFile(path, 'utf8')
    let obj = JSON.parse(decrypt(enc_data, secret))
    return obj
}

async function save_file(name, secret, data) {
    const enc_data = encrypt(JSON.stringify(data), secret)
    const filename = encrypt(name, secret)
    const path = `${base_dir}/${filename}`
    await fs.promises.writeFile(path, enc_data)
    return true
}

async function load_beam_file(beam_name, secret) {
    return await load_file(beam_name, secret) ?? []
}

// ------------------ MESSAGES

function beam_secret(beam_name, beam_code) {
    return beam_name + beam_code + '_beam'
}

async function save_message(beam_name, beam_code, personal_id, message, prevent_log = false) {
    let secret = beam_secret(beam_name, beam_code)
    let beam_file = await load_beam_file(beam_name, secret)
    let message_data = { date: Date.now(), personal_id, message }
    beam_file.push(message_data)
    await save_file(beam_name, secret, beam_file)
    if (!prevent_log)
        sys_log(`${personal_id} saved message\n\n${message}\n\non beam ${beam_name} (${beam_code}) at ${message_data.date}`)
    return message_data
}

// ------------------ SEARCH ENGINE

async function search_in_beam(beam_name, beam_code, query) {
    let secret = beam_secret(beam_name, beam_code)
    let beam_file = await load_beam_file(beam_name, secret)
    let found_messages = beam_file.map(({ date, personal_id, message }) => {
        let str = `date:${date};personal id:${personal_id};${message}`
    })
}

// ---------------------------------------------------------- INIT

async function core_init(io_engine) {
    init_io(io_engine)
    if (!fs.existsSync(base_dir)) {
        fs.mkdirSync(base_dir)
    }
}

// ---------------------------------------------------------- EXPORTS

module.exports = { core_init }
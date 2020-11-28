const { encrypt, decrypt } = require('@rlvt/crypt')
const { TIMEOUT } = require('dns')
const uuid = require('uuid').v4
const fs = require('fs')

// ---------------------------------------------------------- DATA

const base_dir = `${__dirname}/base`
var io = null
const response_to = 2000
const DEBUG = process.env.DEBUG == 'true'

// ---------------------------------------------------------- IO SYSTEM

// ------------------ REQUESTS

let requests = {
    'version': async () => JSON.parse(await fs.promises.readFile(`${__dirname}/package.json`)).version,
    'load_agent': async (agent) => {
        agent = await load_agent(agent)
        return agent
    },
    'load_sub_agent': async ({ agent, sub_agent }) => {
        agent = await load_agent(agent)
        sub_agent = await load_agent(sub_agent)
        if (!agent) sub_agent = null
        return sub_agent
    },
    'save_agent': async ({ agent, from_agent }) => {
        let true_agent = await load_agent(agent)
        if (!true_agent) return false
        if (true_agent.n1) {
            if (!from_agent) return false
            let true_from = await load_agent(from_agent)
            if (true_agent.n1 != true_from?.agent_code) return false
        }
        return await save_agent(agent)
    },
    'register_new_agent': async ({ from_agent, args }) => {
        from_agent = await load_agent(from_agent)
        if (!from_agent) return false
        return await register_new_agent(from_agent, ...args)
    },
    'get_conversation': async (agent) => await get_conversation(agent),
    'register_io': async (agent, socket) => {
        let true_agent = await load_agent(agent)
        if (!true_agent) return false
        let secret = enc_secret(agent)
        if (!agent_sockets[secret]) agent_sockets[secret] = []
        agent_sockets[secret].push(socket)
        return true
    },
    'report': async ({ agent, message }) => {
        return await new_message(agent, agent.agent_code, 'report', message)
    },
    'message': async ({ agent, sub_agent, message }) => {
        return await new_message(sub_agent, agent.agent_code, 'message', message)
    }
}

// ------------------ INIT

var agent_sockets = {}

function init_io(io_engine) {
    io = io_engine
    io.on('connection', (socket) => {
        let secret = null
        socket.on('disconnect', () => {
            if (secret)
                if (agent_sockets[secret])
                    agent_sockets[secret].splice(agent_sockets[secret].indexOf(socket), 1)
        })
        socket.on('request', async ({ name, data }) => {
            if (name == 'register_io') secret = enc_secret(data)
            if (name in requests) {
                setTimeout(async () => socket.emit('request_response', await requests[name](data, socket)), DEBUG ? 0 : response_to)
            }
        })
    })
}

function send_to_agent(agent, name, data) {
    let secret = enc_secret(agent)
    if (!agent_sockets[secret]) return
    agent_sockets[secret].forEach(socket => {
        socket.emit(name + secret, data)
    })
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

// ------------------ AGENT

async function create_agent_object(n1_agent, firstname, lastname, birth, job, status) {
    let code = Math.trunc(Math.random() * 10000)
    let agent_code = (code + '').padStart(5, '0') + '-' + firstname.toUpperCase().charAt(0) + lastname.toUpperCase().charAt(0)
    let agent_secret = DEBUG ? '00000' : Math.trunc(Math.random() * 100000)
    let now = Date.now()
    let new_agent = {
        firstname, lastname,
        code,
        agent_code,
        agent_secret,
        birth,
        job,
        status,
        last_read: now,
        n1: null,
        base: {
            'subs': [],
            'nodes': [],
        }
    }
    if (n1_agent) {
        n1_agent.base.subs.push({ agent_code, agent_secret, last_read: now })
        new_agent.n1 = n1_agent.agent_code
        await save_agent(n1_agent)
    }
    return new_agent
}

function enc_secret(agent) {
    return `${agent.agent_code.toUpperCase()}${agent.agent_secret.toUpperCase()}`
}

async function save_agent(agent) {
    send_to_agent(agent, 'save_agent', agent)
    return await save_file(agent.agent_code, enc_secret(agent), agent)
}

async function load_agent(agent) {
    return await load_file(agent.agent_code, enc_secret(agent))
}

async function register_new_agent(agent, firstname, lastname, birth, job, status) {
    let reg_agent = await create_agent_object(agent, firstname, lastname, birth, job, status)
    await save_agent(reg_agent)
    if (agent) send_to_agent(agent, 'sub_registered', reg_agent)
    return reg_agent
}

// ------------------ MESSAGES

async function get_conversation(agent) {
    return (await load_file(`${agent.agent_code}${agent.agent_secret}conv`, enc_secret(agent))) ?? []
}

async function new_message(agent, author, type, message) {
    let conversation = await get_conversation(agent)
    let message_data = { date: Date.now(), author, type, message }
    conversation.push(message_data)
    send_to_agent(agent, 'new_' + type, message_data)
    return await save_file(`${agent.agent_code}${agent.agent_secret}conv`, enc_secret(agent), conversation)
}

// ---------------------------------------------------------- INIT

async function core_init(io_engine) {
    init_io(io_engine)
    if (!fs.existsSync(base_dir)) {
        fs.mkdirSync(base_dir)
        let pweyland = await register_new_agent(null, 'PETER', 'WEYLAND', '01/10/1990', 'CEO', 'ALIVE')
        console.log('CREATED FIRST AGENT:', pweyland)
    }
}

// ---------------------------------------------------------- EXPORTS

module.exports = { core_init, new_message, get_conversation, register_new_agent, load_agent, save_agent }
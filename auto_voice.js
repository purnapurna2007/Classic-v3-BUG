const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const { getBuffer } = require('../utils/utils'); // Adjust the path to utils.js accordingly

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('../auth_info'); // Adjust the path if necessary

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = Boom?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                startSock();
            }
        } else if (connection === 'open') {
            console.log('Connected');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const sender = msg.key.remoteJid;
            const command = msg.message.conversation || msg.message.extendedTextMessage?.text;

            if (command === 'dexter') {
                const audioUrl = 'https://github.com/purnapurna2007/Audio-mp3/raw/main/Audio/fuck.mp3'; // Replace with your audio URL
                await sendAudio(sock, sender, audioUrl, msg);
            }
        }
    });
}

async function sendAudio(sock, jid, audioUrl, msg) {
    try {
        const audioBuffer = await getBuffer(audioUrl);

        const messageOptions = {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: true,
            contextInfo: {
                mentionedJid: [msg.key.participant || msg.key.remoteJid],
                externalAdReply: {
                    title: "Bot Audio Message",
                    body: "Here is your audio",
                    thumbnailUrl: "https://example.com/thumbnail.jpg", // Replace with your thumbnail URL
                    sourceUrl: "https://example.com" // Replace with your source URL
                }
            }
        };

        await sock.sendMessage(jid, messageOptions, { quoted: msg });
        console.log(`Audio message sent to ${jid}`);
    } catch (error) {
        console.error('Error sending audio message:', error);
    }
}

startSock();

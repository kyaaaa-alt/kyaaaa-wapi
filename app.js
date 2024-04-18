const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs').promises;
const express = require("express");
const { body, validationResult } = require("express-validator");
const { phoneNumberFormatter } = require("./lib/helper"); 
const { DiscordWebhook } = require("./lib/discord");
const app = express();

// const cors = require('cors');
// const corsOptions = {
//   origin: ['https://www.example.com', 'https://www.example2.com']
// };
// app.use(cors(corsOptions));

const cors = require('cors');
app.use(cors());


app.use(express.urlencoded({ extended: true }));

const client = new Client({
    authStrategy: new LocalAuth(),
    webVersionCache: {
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html',
        type: 'remote'
    },
    // puppeteer: {
    //     args: ['--no-sandbox'],
    // }
});

const qrstring = []

client.on('qr', (qr) => {
    console.log('new qr: ',  qr);
    // qrcode.generate(qr, {small: true});
    qrstring.push(qr)
    new DiscordWebhook('Server Status', 'Not Connected :red_circle:', 'Scan QR Code !', 15105570, true).send()
});

client.on('ready', () => {
    console.log('Client is ready !')
    //console log all groups ids
    client.getChats().then(chats => {
        const groups = chats.filter(chat => chat.isGroup);
        console.log('Groups that the bot is in: ');
        groups.forEach(group => console.log("- " + group.name + ": " + group.id._serialized));
    })
    qrstring.push('connected')
    new DiscordWebhook('Server Status', 'Whatsapp Connected :green_circle:', 'API Ready to use!').send()
});

client.on('disconnected', async (reason) => {
    console.log('Disconnected ! Reason : ', reason)
    await cleanup();

    // Reinitialize the client after a delay (if needed)
    setTimeout(() => {
        client.initialize();
    }, 5000);
    new DiscordWebhook('Server Status', 'Disconnected :red_circle:', reason, 15105570, true).send()
});

async function cleanup() {
    // Add your cleanup logic here, such as closing the browser/page, releasing resources, etc.
    // Example:
    if (client.browser) {
        await client.browser.close();
    }
}

client.on('auth_failure', (reason) => {
    fs.rm('.wwebjs_auth', { recursive: true, force: true })
    .then(() => client.initialize())
    .catch((err) => console.error(err))
    console.log('Auth Failure : ', reason)
    new DiscordWebhook('Server Status', 'Auth Failure :red_circle:', reason, 15105570, true).send()
});

client.on('change_state', (state) => {
    console.log('state chaged :', state)
    new DiscordWebhook('Server Status', 'State Changed :white_circle:', state).send()
});

client.on('authenticated', async() => {
    console.log('Client authenticated')
    qrstring.push('connected')
});

client.initialize()

app.get("/", (req, res) => {
    res.send('Running');
});

// 7tD2qLhX3W1Y4ZVKoPE8F9GJrBM5Na6C

const hashCode = s => s.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
}, 0);

app.post("/qr", async (req, res) => {
    if (req.query.token && hashCode(req.query.token) == '1208189695') {
        if (qrstring[qrstring.length - 1] == 'connected') {
            res.status(200).json({
                error: false,
                message: 'connected'
            })
        } else if (qrstring[qrstring.length - 1] == 'undefined') {
            res.status(200).json({
                error: false,
                message: 'loading'
            })
        } else {
            res.status(200).json({
                error: false,
                message: 'QR String fetched successfully',
                qr: qrstring[qrstring.length - 1]
            })
        }
    } else {
        res.status(401).json({
            error: true,
            message: '401 Unauthorized'
        })
    }
});

app.post("/send-message", [body("number").notEmpty(), body("message").notEmpty()], async (req, res) => {
    if (qrstring[qrstring.length - 1] != 'connected') {
        return res.status(400).json({
            error: true,
            message: 'Cannot Send Message, Please Login First!'
        })
    }
    if (req.query.token && hashCode(req.query.token) == '1208189695') {
        try {
            const errors = validationResult(req).formatWith(({ msg }) => {
                return msg;
            });

            if (!errors.isEmpty()) {
                return res.status(422).json({
                    error: true,
                    message: errors.mapped(),
                });
            }

            const original_number = req.body.number
            const number = phoneNumberFormatter(req.body.number)
            const message = req.body.message
            const randomStr = Buffer.from(Math.random().toString()).toString("base64").substring(1,20);
            message += '\n\n' + randomStr;

            client.getNumberId(number).then(resp=>{
                console.log("number_details", resp)
                if(resp) {
                    client.sendMessage(resp._serialized, message).then((response) => {
                        console.log("Send Message: ", response)
                        const sent_to = original_number + ' : ' + message
                        new DiscordWebhook('Notification', 'Message Sent :blue_circle:', sent_to).send()
                        res.status(200).json({
                            error: false,
                            message: response,
                        });
                    }).catch(err => {
                        console.error(err)
                        res.status(500).json({
                            error: true,
                            message: err,
                        });
                    });
                } else {
                    console.log(number, "The number is not registered"+ resp);
                    return res.status(422).json({
                        error: true,
                        message: "The number is not registered",
                    });
                }
            }).catch(error=>{
                console.error(error)
                res.status(500).json({
                    error: true,
                    message: error,
                });
            })
        } catch (err) {
            res.status(500).json({
                error: true,
                message: err,
            });
        }
    } else {
        res.status(401).json({
            error: true,
            message: 'Auth Required',
        });
    }
});

app.post("/group-message", [body("number").notEmpty(), body("message").notEmpty()], async (req, res) => {
    if (qrstring[qrstring.length - 1] != 'connected') {
        return res.status(400).json({
            error: true,
            message: 'Cannot Send Message, Please Login First!'
        })
    }
    if (req.query.token && hashCode(req.query.token) == '1208189695') {
        try {
            const errors = validationResult(req).formatWith(({ msg }) => {
                return msg;
            });

            if (!errors.isEmpty()) {
                return res.status(422).json({
                    error: true,
                    message: errors.mapped(),
                });
            }

            const original_number = req.body.number
            const number = original_number + '@g.us'

            const message = req.body.message
            const randomStr = Buffer.from(Math.random().toString()).toString("base64").substring(1,20);
            message += '\n\n' + randomStr;

            client.sendMessage(number, message).then((response) => {
                console.log("Send Message: ", response)
                new DiscordWebhook('Notification', 'Group Message Sent :blue_circle:', message).send()
                res.status(200).json({
                    error: false,
                    message: response,
                });
            }).catch((error) => {
                console.error(error)
                res.status(500).json({
                    error: true,
                    message: error,
                });
            });
        } catch (err) {
            res.status(500).json({
                error: true,
                message: err,
            });
        }
    } else {
        res.status(401).json({
            error: true,
            message: 'Auth Required',
        });
    }
});
 
app.listen(8000, function () {
    console.log('Server Running...');
});
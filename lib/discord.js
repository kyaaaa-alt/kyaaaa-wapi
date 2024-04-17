const axios = require('axios')
const defaultWebhookUrl = 'https://discord.com/api/webhooks/1085998188915343450/88NXButTc-r2DICULoSKuI2jpoEAu6q66TcAoxXJVOueOUojaBwrzhymxpBKB0J2Bmph'

class DiscordWebhook {
    constructor(title = '', msg, act = '-', color= 5174599, mention = false) {
        this.title = title
        this.msg = msg
        this.act = act
        this.color = color
        this.mention = mention == true ? '<@&1048107430485180466> ' : ' '
    }

    async send() {
        const dateTemplate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        const timeTemplate = { hour: '2-digit', minute: '2-digit' }
        const date = new Date().toLocaleDateString('id-ID', dateTemplate)
        const time = new Date().toLocaleTimeString('id-ID', timeTemplate)
        let payload = {
            username: 'WA-API',
            embeds: [
                {
                    title: `${this.title}`,
                    color: this.color,
                    footer: {
                        text: `📅 ${date} @${time}`,
                    },
                    fields: [
                        {
                            name: 'Messages',
                            value: `${this.msg}`,
                            inline: true,
                        },
                        {
                            name: 'Note',
                            value: `${this.act}`,
                            inline: false,
                        }
                    ]
                },
            ],
            content: `@here`,
            allowed_mentions: {
                roles: ['1048107430485180466']
            }
        };

        let data = JSON.stringify(payload);
        var config = {
            method: "POST",
            url: defaultWebhookUrl,
            headers: { "Content-Type": "application/json" },
            data: data,
        };

        axios(config)
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.log(error);
                return error;
            });
    }
}

module.exports = {
    DiscordWebhook
}

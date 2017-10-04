const request = require('request');
const weather = require('./weather.js');
const greets = require('./greets.js');
const commands = require('./commands.js');

function performCommands(msgObj) {
    var msg = msgObj.message.text;
    var attachment = msgObj.message.attachments;
    var sender = msgObj.sender.id;

    if (msg) {
        msg = msg.toLowerCase();

        //special case where a parameter is taken
        if (msg.beginsWith("define")) {
            var wordArray = msg.split(" ");
            wordArray.shift();
            var wordToBeDefined = wordArray.join(" ");
            commands.getDefinition(sender, wordToBeDefined);
            return;
        }
        switch (msg) {
            case "hi":
            case "hey":
            case "hello":
            case "yo":
            case "ohayo":
                commands.getHello(sender);
                break;
            case "goodnight":
            case "gn":
            case "oyasumi":
                commands.getGoodbye(sender);
                break;
            case "epoch":
                commands.getEpoch(sender, msgObj.timestamp);
                break;
            case "random":
                commands.getRandom(sender);
                break;
            case "inspire":
                commands.getInspire(sender);
                break;
            case "help":
                commands.getHelp(sender);
                break;
            case "setting":
                commands.getSetting(sender);
                break;
            case "weather":
                weather.getWeather(sender);
                break;
            case "detailed weather":
                weather.getDetail(sender);
                break;
            case "forecast":
                weather.getForecast(sender);
                break;
            case "start cron":
            case "on":
                greets.startCron(sender);
                break;
            case "stop cron":
            case "off":
                greets.stopCron(sender);
                break;
            default:
                errorMsg(sender);
        }
    }
    else if (attachment) {
        if (attachment[0].type === 'location') {
            weather.getLocation(sender, attachment[0].payload.coordinates);
        }
        else {
            commands.getEmoji(sender);
        }
    }
}

function userMsg(msgEvent) {
    var sender = msgEvent.id;

    if (msgEvent.message) {
        performCommands(msgEvent);
    }
    else if (msgEvent.postback) {
        greets.getStarted(msgEvent);
    }
}

function errorMsg(sender) {
    sendMessage(sender, "I couldn't understand the input, please give a valid command");
}

function sendMessage(sender, text) {
    var messageData = {
        text: text
    };

    messengerRequest(sender, messageData);
}

function sendCronMessage(sender) {
    var messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "First, would you like me to greet you at 8:00am everyday?",
                "buttons": [
                    {
                        "type": "postback",
                        "title": "Yes",
                        "payload": "CRON_YES"
                    }, {
                        "type": "postback",
                        "title": "No",
                        "payload": "CRON_NO"
                    }]
            }
        }
    }

    messengerRequest(sender, messageData);
}

function getUserLocation(sender, msg) {
    var messageData = {
        "text": msg,
        "quick_replies": [
            {
                "content_type": "location"
            }
        ]
    };

    messengerRequest(sender, messageData);
}

function sendMorningMessage(sender) {
    var messageData = {
        "text": "Which type of weather would you like?",
        "quick_replies": [
            {
                "content_type": "text",
                "title": "Weather",
                "payload": "WEATHER"
            },
            {
                "content_type": "text",
                "title": "Detailed Weather",
                "payload": "DETAILED_WEATHER"
            }
        ]
    };

    messengerRequest(sender, messageData);
}

function messengerRequest(sender, messageData) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.FB_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });
}

request({
    url: 'https://graph.facebook.com/v2.6/me/thread_settings',
    qs: { access_token: process.env.FB_ACCESS_TOKEN },
    method: 'POST',
    json: {
        setting_type: "call_to_actions",
        thread_state: "existing_thread",
        call_to_actions: [
            {
                type: "postback",
                title: "Current Weather",
                payload: "WEATHER"
            },
            {
                type: "postback",
                title: "Forecast",
                payload: "FORECAST"
            },
            {
                type: "postback",
                title: "Help",
                payload: "HELP"
            },
            {
                type: "postback",
                title: "Setting",
                payload: "SETTING"
            }
        ]
    }
}, function (error, response, body) {
    if (error) {
        console.log('Error sending messages: ', error);
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
})


exports.userMsg = userMsg;
exports.errorMsg = errorMsg;
exports.sendMessage = sendMessage;
exports.performCommands = performCommands;
exports.sendCronMessage = sendCronMessage;
exports.getUserLocation = getUserLocation;
exports.sendMorningMessage = sendMorningMessage;

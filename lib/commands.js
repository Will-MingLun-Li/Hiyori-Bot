const fs = require('fs');
const request = require('request');
const greets = require('./greets.js');
const bot = require('./bot.js');
var Dictionary = require("oxford-dictionary-api");
var dict = new Dictionary(process.env.OXFORD_APP_ID, process.env.OXFORD_APP_KEY);
const MAX_NUM_DEFINITIONS = 3;
var quotes;
fs.readFile('misc/quotes.json', function (err, data) {
    if (err) {
        console.log(err);
    }
    else {
        quotes = JSON.parse(data);
    }
});


function getHello(sender) {
    var msg = ["Oh hi!", "Hey there :)", "Ohayo", "Hello!", "Hiiiii~", "Xin Chào", "Hey~~"];
    var rand = msg[Math.floor(Math.random() * msg.length)];
    bot.sendMessage(sender, rand);
}

function getGoodbye(sender) {
    var msg = ["Bye :(", "Sweet dreams!", "Oyasumi", "Oh goodnight!", "Remember to set an alarm :)", "Bye-Bye~"];
    var rand = msg[Math.floor(Math.random() * msg.length)];
    bot.sendMessage(sender, rand);
}

function getEpoch(sender, timestamp) {
    timestamp = Math.floor(timestamp / 1000);
    bot.sendMessage(sender, timestamp.toString());
}

function getRandom(sender) {
    var headTail = Math.floor(Math.random() * 2) ? "Head" : "Tail";
    var randNum = Math.floor(Math.random() * 100);
    var randLetter = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 1);

    bot.sendMessage(sender, headTail + ' ' + randNum + ' ' + randLetter.toUpperCase());
}

function getInspire(sender) {
    var rand = Math.floor(Math.random() * quotes.length);
    bot.sendMessage(sender, quotes[rand]);
}

function getHelp(sender) {
    var msg = "Hey there! I'm Hiyori and I can tell you the weather and a few other fun things :)\n"
        + "Here are some commands: \n\n   -weather \n   -detailed weather \n   -epoch \n"
        + "   -random \n   -inspire \n   -forecast";

    bot.sendMessage(sender, msg);
}

function getEmoji(sender) {
    var msg = ["Sugoi", ":poop:", "✌✌✌", "I N N O V A T I V E", "D I S R U P T I V E", "(y)"];
    var rand = msg[Math.floor(Math.random() * msg.length)];
    bot.sendMessage(sender, rand);
}

function getDefinition(sender, word) {
    dict.find(word, function (error, data) {
        if (error) {
            bot.send(sender, "I couldn't find that word :[");
            return;
        }
        var dictEntries = data.results[0].lexicalEntries[0].entries[0].senses;
        var numDefinitions = dictEntries.length > MAX_NUM_DEFINITIONS ? MAX_NUM_DEFINITIONS : dictEntries.length;
        var definitionMessage = "";
        dictEntries.forEach((entry) => {
            definitionMessage += "• " + entry.definitions + ";\n";
        })
        bot.sendMessage(sender, definitionMessage);
    });

}

function getSetting(sender) {
    var messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "I gotchu! Which setting would you like to change?",
                "buttons": [
                    {
                        "type": "postback",
                        "title": "Change location",
                        "payload": "CHANGE_LOCATION"
                    }, {
                        "type": "postback",
                        "title": "Change notification",
                        "payload": "CHANGE_NOTIFICATION"
                    }]
            }
        }
    }

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

function changeLocation(sender) {
    var msg = "Please share your new location with me :)";
    bot.getUserLocation(sender, msg);
}

function changeNotication(sender) {
    var messageData = {
        "text": "Would you like to turn the greeting message every morning...",
        "quick_replies": [
            {
                "content_type": "text",
                "title": "ON",
                "payload": "start cron"
            },
            {
                "content_type": "text",
                "title": "OFF",
                "payload": "stop cron"
            }
        ]
    };

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

exports.getEpoch = getEpoch;
exports.getRandom = getRandom;
exports.getInspire = getInspire;
exports.getHelp = getHelp;
exports.getSetting = getSetting;
exports.changeLocation = changeLocation;
exports.changeNotication = changeNotication;
exports.getHello = getHello;
exports.getGoodbye = getGoodbye;
exports.getEmoji = getEmoji;
exports.getDefinition = getDefinition;
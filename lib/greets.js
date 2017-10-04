const request = require('request');
const cron = require('node-cron');
const fs = require('fs');
const bot = require('./bot.js');
const weather = require('./weather.js');
const commands = require('./commands.js')

var cronTask = {};
var userInfo;


function getStarted(msgEvent) {
    var sender = msgEvent.sender.id;
    var payload = msgEvent.postback.payload;

    switch (payload) {
        case "GET_START":
            getUserInfo(sender);
            bot.sendMessage(sender, "Oh hello! I'm Hiyori and I will keep you updated on the weather :)");
            setTimeout(function () { bot.sendCronMessage(sender) }, 1000);
            break;
        case "CRON_YES":
            setTimeout(function () { setCron(sender) }, 3000);
            bot.sendMessage(sender, "Okay! I will greet you every morning at 8:00am! Use 'stop cron' if you need a break from me :(");
            setTimeout(function () { bot.getUserLocation(sender, "One last thing, please share your location with me so I can do my job!") }, 1000);
            break;
        case "CRON_NO":
            bot.sendMessage(sender, "Okay :( You can always use 'start cron' to have me greet you!");
            setTimeout(function () { bot.getUserLocation(sender, "One last thing, please share your location with me so I can do my job!") }, 1000);
            break;
        case "WEATHER":
            weather.getWeather(sender);
            break;
        case "FORECAST":
            weather.getForecast(sender);
            break;
        case "HELP":
            commands.getHelp(sender);
            break;
        case "SETTING":
            commands.getSetting(sender);
            break;
        case "CHANGE_LOCATION":
            commands.changeLocation(sender);
            break;
        case "CHANGE_NOTIFICATION":
            commands.changeNotication(sender);
            break;
        default:
            bot.errorMsg(sender);
    }
}

// Fetching the user info
function getUserInfo(user_id) {
    userInfo = JSON.parse(fs.readFileSync('misc/users.json'));

    var userInfoParams = {
        url: 'https://graph.facebook.com/v2.6/' + user_id,
        qs: {
            fields: 'first_name, timezone',
            access_token: process.env.FB_ACCESS_TOKEN
        },
        method: 'GET'
    };

    request(userInfoParams, function (error, response, body) {
        if (error) {
            console.log("Error retrieving user info: " + error);
        }
        else if (response.body.error) {
            console.log("Error: " + response.body.error);
        }
        else {
            var user = JSON.parse(body);

            userInfo[user_id] = {
                'name': user.first_name,
                'timeZone': user.timezone
            };

            fs.writeFileSync('misc/users.json', JSON.stringify(userInfo, null, 2));
        }
    });
}

// Stops the cronjob
function stopCron(sender) {
    cronTask[sender].stop();
    bot.sendMessage(sender, "I will always be here for you... Use 'start cron' if you want me back :'(");
}

// Start the cronjob again
function startCron(sender) {
    setCron(sender);
    bot.sendMessage(sender, "Hi " + userInfo[sender].name + "! It's good to be back :)");
}

// Setting up the cron to send msg
function setCron(user_id) {
    var hour = 8 - parseInt(userInfo[user_id].timeZone);
    var schedule = '0 ' + hour + ' * * *'

    cronTask[user_id] = cron.schedule(schedule, function () {
        sendMorningMsg(user_id);
    });
}

function sendMorningMsg(user_id) {
    var date = new Date();
    var wd = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    var calDate = date.toJSON().slice(0, 10);
    var weekDay = wd[date.getDay() - 1];

    var today = weekDay + ' ' + calDate.toString();
    var morningMsg = "Good morning " + userInfo[user_id].name + '! \n It\'s ' + today + '. ';
    bot.sendMessage(user_id, morningMsg);
    setTimeout(function () { bot.sendMorningMessage(user_id) }, 1000);
}

// Greeting text before user 'Get Started'
request({
    url: 'https://graph.facebook.com/v2.6/me/thread_settings',
    qs: { access_token: process.env.FB_ACCESS_TOKEN },
    method: 'POST',
    json: {
        setting_type: "greeting",
        greeting: {
            text: "Hi {{user_first_name}}. I will keep you updated on the weather"
            + " and provide you with some other functions! Click 'Get Started' and start talking to me :)"
        }
    }
}, function (error, res, body) {
    if (error) {
        console.log('Error sending messages: ', error);
    } else if (res.body.error) {
        console.log('Error: ', res.body.error);
    }
});

exports.getStarted = getStarted;
exports.startCron = startCron;
exports.stopCron = stopCron;

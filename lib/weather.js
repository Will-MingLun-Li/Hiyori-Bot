const request = require('request');
const geocoder = require('geocoder');
const fs = require('fs');
const bot = require('./bot.js');

var userInfo = {};

function kelvinToCelsius(tempK) {
    return (tempK - 273.15);
}

function windDirection(degrees) {
    var dir;

    switch (degrees) {
        case 0:
        case 360:
            dir = 'N';
            break;
        case 90:
            dir = 'E';
            break;
        case 180:
            dir = 'S';
            break;
        case 270:
            dir = 'W';
            break;
    }

    if (!dir) {
        if (degrees < 90) {
            dir = 'NE';
        }
        else if (degrees > 90 && degrees < 180) {
            dir = 'SE';
        }
        else if (degrees > 180 && degrees < 270) {
            dir = 'SW';
        }
        else if (degrees > 270 && degrees < 360) {
            dir = 'NW';
        }
    }

    return dir;
}

function epochToTime(epoch, timeZone) {
    var currDate = new Date(epoch * 1000);
    var hours = currDate.getHours() + timeZone;
    var mins = currDate.getMinutes();
    var unit = 'am';

    if (hours === 0) {
        hours === 12;
    }
    else if (hours === 12) {
        unit = 'pm';
    }
    else if (hours > 12 && hours < 24) {
        hours -= 12;
        unit = 'pm';
    }

    var time = hours.toString() + ':' + mins.toString() + unit;

    return time;
}

function getLocation(sender, coordinates) {
    userInfo = JSON.parse(fs.readFileSync('misc/users.json'));

    var lat = coordinates.lat;
    var lon = coordinates.long;

    var country, city;

    geocoder.reverseGeocode(lat, lon, function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            data.results[0].address_components.forEach(function (obj) {
                if (obj.types[0] === 'locality') {
                    city = obj.short_name;
                }
                if (obj.types[0] === 'country') {
                    country = obj.long_name;
                    location = city + "," + obj.short_name;
                }
            });

            userInfo[sender].location = location;

            fs.writeFileSync('misc/users.json', JSON.stringify(userInfo, null, 2));

            bot.sendMessage(sender, country + "! Cool! And " + city + " sounds like a fun city :P");
            setTimeout(function () { bot.sendMessage(sender, "Great! All set! Use 'help' if you forgot what I can do.") }, 1000);
        }
    });
}

function getWeather(user_id) {
    if (userInfo[user_id] && userInfo[user_id].location) {
        var weatherParam = {
            url: 'http://api.openweathermap.org/data/2.5/weather',
            qs: {
                q: userInfo[user_id].location,
                appid: process.env.WEATHERID
            },
            method: 'GET'
        };

        request(weatherParam, function (error, response) {
            if (error) {
                console.log("Error retrieving weather data: " + error);
                bot.errorMsg(user_id);
            }
            else {
                var res = JSON.parse(response.body);
                var condition = res.weather[0].description;
                var temp = kelvinToCelsius(res.main.temp).toFixed(2) + '°C';

                var msg = 'Currently in ' + res.name + ': \n'
                    + 'It is ' + temp + ' with ' + condition;

                bot.sendMessage(user_id, msg);
            }
        });
    }
    else {
        bot.sendMessage(user_id, "I can't get you weather without knowing your location!");
        setTimeout(function () { bot.getUserLocation(user_id, "Please share your location with me!") }, 1000);
    }
}

function getDetail(user_id) {
    if (userInfo[user_id] && userInfo[user_id].location) {
        var weatherParam = {
            url: 'http://api.openweathermap.org/data/2.5/weather',
            qs: {
                q: userInfo[user_id].location,
                appid: process.env.WEATHERID
            },
            method: 'GET'
        };

        request(weatherParam, function (error, response) {
            if (error) {
                console.log("Error retrieving weather data: " + error);
                bot.errorMsg(user_id);
            }
            else {
                var res = JSON.parse(response.body);
                var condition = res.weather[0].description;
                var temp = kelvinToCelsius(res.main.temp).toFixed(2) + '°C';

                var msg = 'Currently in ' + res.name + ': \n' + 'Condition: ' + condition + ' & ' + temp + '\n'
                    + 'Humidity: ' + res.main.humidity + '% &' + ' Pressure: ' + res.main.pressure + 'hPa \n'
                    + 'Wind Speed: ' + res.wind.speed + 'km/h ' + windDirection(res.wind.deg) + '\n'
                    + 'Sunrise: ' + epochToTime(res.sys.sunrise, userInfo[user_id].timeZone) + ' 🌞 & Sunset: '
                    + epochToTime(res.sys.sunset, userInfo[user_id].timeZone) + ' 🌛\n';

                bot.sendMessage(user_id, msg);
            }
        });
    }
    else {
        bot.sendMessage(user_id, "I can't get you weather without knowing your location!");
        setTimeout(function () { bot.getUserLocation(user_id, "Please share your location with me!") }, 1000);
    }
}

function getForecast(user_id) {
    if (userInfo[user_id] && userInfo[user_id].location) {
        var weatherParam = {
            url: 'http://api.openweathermap.org/data/2.5/weather',
            qs: {
                q: userInfo[user_id].location,
                appid: process.env.WEATHERID
            },
            method: 'GET'
        };

        request(weatherParam, function (error, response) {
            if (error) {
                console.log("Error retrieving weather data: " + error);
                bot.errorMsg(user_id);
            }
            else {
                var res = JSON.parse(response.body);
                var condition = res.weather[0].description;
                var tempMin = kelvinToCelsius(res.main.temp_min).toFixed(2) + '°C';
                var tempMax = kelvinToCelsius(res.main.temp_max).toFixed(2) + '°C';

                var msg = "Hey " + userInfo[user_id].name + "! There's gonna be " + condition + " with a high of "
                    + tempMax + " and a low of " + tempMin + " today!";

                bot.sendMessage(user_id, msg);
                setTimeout(function () { bot.sendMessage(user_id, "Remember to dress appropriately for the weather!") }, 1000);
            }
        });
    }
    else {
        bot.sendMessage(user_id, "I can't get you weather without knowing your location!");
        setTimeout(function () { bot.getUserLocation(user_id, "Please share your location with me!") }, 1000);
    }
}

exports.getLocation = getLocation;
exports.getWeather = getWeather;
exports.getDetail = getDetail;
exports.getForecast = getForecast;

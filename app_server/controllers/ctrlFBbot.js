

const request = require('request');
const cheerio = require('cheerio')
//var mongoose = require('mongoose')
//var Link = mongoose.model('Link');
//const { Link } = require('../models/links')
const { User, Link } = require('../models/users')
const { Util, botResponse } = require('./util');
const config = require('../config/config')

function fbAuthToken(req, res) {

    let VERIFY_KEY = 'ThisIsSecret';

    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    console.log(req.query);

    if (mode && token) {
        if (mode === 'subscribe' && token == VERIFY_KEY) {
            res.status(200).send(challenge);
        } else {
            console.log('Invalid token');
        }
    } else {
        res.sendStatus(404);
    }

}

function fbbot(req, res) {


    var entries = req.body.entry;
    //console.log(entries.json());
    for (var entry of entries) {
        var messaging = entry.messaging;
        for (var message of messaging) {
            var senderId = message.sender.id;
            if (message.message) {
                // If user send text
                if (message.message.text) {
                    var text = message.message.text.trim();
                    console.log(text); // In tin nhắn người dùng
                    console.log(senderId);

                    if (senderId) {
                        //Check signup
                        User.findOne({ botID: senderId }, (err, user) => {
                            const regexCommand = /^(\/\w+).*/g;
                            const command = regexCommand.exec(text);

                            if (err) {
                                return new Error('Check Signup error')
                            }

                            if (!command) return callSendAPI(senderId, "_Mình chỉ làm theo lệnh, không trả lời linh tinh đâu hix :'( . Gõ /help để xem cách #nguocdai mình nhé hehe._")

                            if (!user) {
                                console.log('No user')
                                if (text === '/help') return callSendAPI(senderId, botResponse.help)
                                switch (command[1]) {

                                    case '/active':
                                        const regexParameter = /^(\/\w+)\s+(.*)/g
                                        const parameter = regexParameter.exec(text);
                                        if (!parameter) return callSendAPI(senderId, 'Sai cú pháp kich hoạt bot rồi nhé :)');
                                        const keycode = parameter[2];
                                        if (!keycode || keycode === 'default') return callSendAPI(senderId, 'Sai cú pháp kich hoạt bot rồi kìa -_-');
                                        User.findOneAndUpdate({
                                            salt: keycode
                                        }, {
                                                botID: senderId
                                            }, (err, user) => {
                                                if (err) {
                                                    console.log(err);
                                                    return callSendAPI(senderId, 'Đã có lỗi, vui lòng thực hiện lại.')
                                                }
                                                if (!user) {
                                                    return callSendAPI(senderId, 'Keycode sai rồi, kiểm tra keycode và kích hoạt lại nha.')
                                                }
                                                callSendAPI(senderId, 'Kích hoạt @bot thành công rồi nha ' + user.name + ' :D');
                                            })
                                        //----------

                                        break;
                                    default:
                                        callSendAPI(senderId, 'Cú pháp không được hỗ trợ. Gõ /help để được hướng dẫn nhé.')
                                        break;
                                }
                            } else {
                                //User da kich hoat bot
                                console.log('Co user');

                                if (text === '/help') {
                                    return callSendAPI(senderId, botResponse.details)
                                }
                                else {
                                    //Xu lu chuc nang
                                    //if (user.botID != 'default') return callSendAPI(senderId, 'Bạn đã kích hoạt @bot rồi mà bro??')
                                    //return callSendAPI(senderId, 'Gõ /help để xem thông tin chức năng nhé')
                                    console.log('Text: ', text);
                                    switch (command[1]) {
                                        case '/a':
                                            //share regex
                                            var linkState = 'private';
                                            const regexShare = /\s-s/g;
                                            const parameterShare = regexShare.exec(text);
                                            if (parameterShare) {
                                                //set state tu private -> pending
                                                const regexNote = /-s\s\'(.*)\'/g
                                                const matchNote = regexNote.exec(text)
                                                if (!matchNote) {
                                                    linkState = 'pending';
                                                } else {
                                                    linkState = 'pending|' + matchNote[1]
                                                }
                                            }
                                            //check -d
                                            const regexDir = /\s-d/g;
                                            const matchDir = regexDir.exec(text);
                                            var _dir = 'root'
                                            if(matchDir){
                                                const regexDirName = /-d\s\'(.*)\'/g
                                                const matchDirName= regexDirName.exec(text)
                                                
                                                
                                                if(matchDirName) {
                                                    const submitDir = matchDirName[1]
                                                    console.log('submitdir ', submitDir)
                                                    const isExist = user.directory.includes(submitDir)
                                                    if(!isExist) return callSendAPI(senderId, 'Tớ có thấy thư mục *' + submitDir + '* đâu ta? :/');
                                                    _dir = submitDir
                                                }else{
                                                    return callSendAPI(senderId, 'Quên điền tên thư mục rồi kìa ấy ơi! Gõ /dir để xem danh sách thư mục nhé.');
                                                }
                                                
                                            }
                                            console.log('_dir ', _dir)
                                            //---
                                            const regexParameter = /^\/a\s([^\s]+)/g
                                            const parameter = regexParameter.exec(text);
                                            if (!parameter) return callSendAPI(senderId, 'Sai cú pháp add link bot rồi nhé :)');
                                            const getLink = parameter[1];
                                            if (!getLink) return callSendAPI(senderId, 'Sai cú pháp add link bot rồi kìa -_-');
                                            addToDB(getLink, senderId, linkState, _dir, (err, state) => {
                                                if (!err) {
                                                    if (state === 'private')
                                                        return callSendAPI(senderId, 'Đã thêm link thành công rồi nhé chủ nhơn :)');
                                                }
                                                callSendAPI(senderId, 'Đã thêm link thành công và chờ duyệt chia sẻ lên trang chủ @tuibittat rồi nhé chủ nhơn :)');
                                            });
                                            //

                                            break;
                                        case '/dir':
                                            const dir = user.directory.join(', ');
                                            callSendAPI(senderId, 'Danh sách thư mục của ngài đây: *' + dir + '*')
                                            break;
                                      
                                        default:
                                            callSendAPI(senderId, 'Cú pháp không được hỗ trợ. Gõ /help để được hướng dẫn nhé.')
                                            break;
                                    }


                                }


                            }
                        })

                        //callSendAPI(senderId, "Tui là bot đây: " + text);
                    }
                    //addToDB(text);
                }
            }
        }
    }

    //res.status(200).send("OK");
    Util.sendResponse(res, 200, {
        "status": 200,
        "msg": "Added to DB."
    })
}

function postingFB(link, user, note, cb) {
    const desc =
        `${note}
     
    [Shared by + ${user.name}]`;
    request({
        "uri": "https://graph.facebook.com/194442694037009/feed?message=" + desc + "&link=" + link + "&access_token=" + config.pageToken,
        "method": "POST",
    }, (err, res, body) => {
        if(body) console.log('Posting return: ', body)
        if (!err) {
            console.log('Shared link!')
            return cb(res.statusCode)
        } else {
            console.error("Unable to share link:" + err);
            return cb(res.statusCode)
        }
    })
}

// Gửi thông tin tới REST API để trả lời
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": {
            "text": response
        }
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": config.pageToken },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}



function addToDB(link, botID, linkState, dir, cb) {
    //console.log(link + '.')
    var webtitle = link;
    request(link, (err, res, body) => {
        if (err || res.statusCode != 200) {

            console.log(`Loi get title: ${err} statuCode ${res.statusCode}}`)
        } else {
            const $ = cheerio.load(body);
            webtitle = $('title').text();
            console.log(`WEBTITLE: ${webtitle}`);
        }

        // Link.create({
        //     address: link,
        //     title: webtitle
        // }, (error, link) => {
        //     if (error) { console.log('**********Loi add document') } else {
        //         console.log(`********Add document thanh cong: ${link}`)
        //     }

        // });
        const newLink = new Link({
            botID,
            state: linkState,
            directory: dir,
            address: link,
            title: webtitle
        })
        console.log('new link: ', newLink)
        User.findOne({ botID }, (err, user) => {
            if (err) return console.log(err);
            if (!user) return console.log('Add link cannot find user')
            user.link.push(newLink);
            user.save((err) => {
                if (err) {
                    console.log(err);
                    return cb(err)
                }
                cb(null, linkState)
            })
        })
    })


}


module.exports = { fbAuthToken, fbbot, postingFB, callSendAPI }

// var jwt = require('jsonwebtoken');

// var token = jwt.sign({name: "duy"}, 'thisIsSecret');

// console.log(token);

// var decoded = jwt.verify(token, 'thisIsSecret');
// console.log(decoded)

//------------------------

// var test = '+abc.com -s'

// var regex = /^\+(.*)\s](-s)?/g

// var match = regex.exec(test);
//============

// var test = ['a', 'b', 'c']

// for (var e of test){
//     console.log(e)
//     if(e === 'a')
//     {
//         delete e;
//         break;
//     }
// }

// console.log(test);

const request = require('request')

request('https://stackoverflow.com/questions/337488emplate-ajax', (er, res, body) =>{
    if(er) console(er);
    console.log(res.statusCode)
  //console.log(body)

})
var app = require('http').createServer(handler)
    , staticserver = require('node-static')
    , file = new staticserver.Server()
    , twitter = require('ntwitter')
    , io = require('socket.io').listen(app)
    , twitcreds = require('./twittercreds.js');

// some local vars:
var iTwitCount = 0;

// start listening:
app.listen(8080);

// http handler (mainly static content serving):
function handler(request, response){
    // serve files:
    request.addListener('end', function(){
        file.serve(request, response);
    });
}

// Socket handler:
io.sockets.on('connection', function(socket){
    console.log('new connection');
});

// twitter:
//var tw = new twitter(twitcreds).stream('statuses/sample'
//    , function(stream){
//        stream.on('data', function(tweet){
//            iTwitCount++;
//
//            //console.log(tweet.text);
//            //console.log(tweet.text.length);
//            //console.log(iTwitCount);
//            //console.log('=============================================');
//
//            // send to all clients:
//            io.sockets.emit('data', {len:tweet.text.length});
//        })
//});

// TEST:
setInterval(function(){
    io.sockets.emit('data', {len:Math.floor((Math.random()*140)+1)});
}, 1);
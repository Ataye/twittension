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
var bUseTwitter = process.env.NODE_ENV === 'production';
console.log('Using Twitter Stream: ' + bUseTwitter);
if (bUseTwitter){

    // get data from twitter:
    var tw = new twitter(twitcreds).stream('statuses/sample'
        , function(stream){
            stream.on('data', function(tweet){
                // send to all clients:
                io.sockets.emit('data', {len:tweet.text.length});
            })
    });

} else {

    // TEST, make data:
    setInterval(function(){
        io.sockets.emit('data', {len:Math.floor((Math.random()*140)+1)});
    }, 2);

}

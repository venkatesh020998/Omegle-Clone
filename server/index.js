// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Room = require('./model/roomModel');

const app = express();
const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: '*',
    }
});
const { RtmTokenBuilder, RtmRole } = require('agora-access-token');
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
NEXT_PUBLIC_AGORA_APP_ID = "39f30d3c0df04349bb81efdd2b591992"
AGORA_APP_CERT = "1b898914d1d64d96a01d3c28d579c06a"


// MongoDB connection URL
const url = 'mongodb://127.0.0.1:27017/Omegle';

// Connect to MongoDB using Mongoose
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(error => console.error(error));

function getRtmToken(userId) {
    const appID = NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = AGORA_APP_CERT;
    const account = userId;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    const token = RtmTokenBuilder.buildToken(
        appID,
        appCertificate,
        account,
        RtmRole.Rtm_User,
        privilegeExpiredTs
    );
    return token;
}

function getRtcToken(roomId, userId) {
    console.log("userId", userId)
    const appID = NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = AGORA_APP_CERT;
    const channelName = roomId;
    const account = userId;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    const token = RtcTokenBuilder.buildTokenWithAccount(
        appID,
        appCertificate,
        channelName,
        account,
        role,
        privilegeExpiredTs
    );

    return token;
}


// Socket.io connection
io.on('connection', socket => {
    console.log('A user connected');

    // Handle a custom event
    socket.on('addToRoom', data => {

         Room.aggregate([
            { $match: { status: "waiting" } },
            { $sample: { size: 1 } },
          ])
            .then(result => {
                let rooms;
                if (result.length > 0) {
                    rooms = result;
                    Room.findOneAndUpdate({ _id: rooms[0]._id }, { status: "chatting" })
                        .then(result => {
                            console.log('Data inserted:', result);
                            socket.emit('addToRoomResponse', {
                                rooms: rooms,
                                rtcToken: getRtcToken(rooms[0]._id.toString(), data.userId),
                                rtmToken: getRtmToken(data.userId),
                            });
                        }).catch(error => console.error(error));

                    // socket.join(roomId);
                } else {

                    socket.emit('addToRoomResponse', {
                        rooms: [],
                    });


                }

            }).catch(error => console.error(error));

    });

    socket.on('setRoomToWaiting', data => {
        Room.findOneAndUpdate({ _id: data.roomId }, { status: "waiting" })
            .then(result => {
            }).catch(error => console.error(error));
    });

    socket.on('createRoom', data => {
        Room.create({
            status: "waiting",
        }).then(result => {
            socket.emit('createRoomResponse', {
                room: result,
                rtcToken: getRtcToken(result._id.toString(), data.userId),
                rtmToken: getRtmToken(data.userId),
            });
        })
    });
    socket.on('leaveRoom', data => {
        Room.findOneAndUpdate({ _id: data.roomId }, { status: "waiting" })
            .then(result => {
            }).catch(error => console.error(error));
    })

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

// src/components/VideoCall.js

import React, { useEffect, useRef, useState } from 'react';
import RtmChannel from "agora-rtm-sdk";
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from './socketProvider';
import AgoraRTM from 'agora-rtm-sdk'
import {
    ICameraVideoTrack,
    IRemoteVideoTrack,
    IAgoraRTCClient,
    IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";
import '../style/videoModule.css'


const APP_ID = '39f30d3c0df04349bb81efdd2b591992';
const CHANNEL = 'My New Project';
const TOKEN = '007eJxTYFilwFXIxWTmHnCfXfRdoVv89jU99uFlWg9ubdOL3iw954YCg7FlmrFBinGyQUqagYmxiWVSkoVhalpKilGSqaWhpaXRCY/ZaQ2BjAxLF+qwMjJAIIjPx+BbqeCXWq4QUJSflZpcwsAAAL8yIMc='; // Generate a temporary token from Agora Console for testing


export const VideoPlayer = ({
    videoTrack,
    style,
}: {
    videoTrack: IRemoteVideoTrack | ICameraVideoTrack;
    style: object;
}) => {
    const ref = useRef(null);

    useEffect(() => {
        const playerRef = ref.current;
        if (!videoTrack) return;
        if (!playerRef) return;

        videoTrack.play(playerRef);

        return () => {
            videoTrack.stop();
        };
    }, [videoTrack]);

    return <div ref={ref} style={style}></div>;
};
const VideoCall = () => {
    const client = useRef<any>(null);
    const localVideoTrack = useRef<any>(null);
    const [remoteUsers, setRemoteUsers] = useState<any>([]);
    const localContainerRef = useRef<any>(null);
    const remoteContainerRef = useRef<any>(null);
    const [messages, setMessages] = useState<any>([]);
    const channelRef = useRef<any>();
    const [input, setInput] = useState("");
    const [localuserId, setLocaluserId] = useState('')
    const location = useLocation();
    const ref = useRef(null);
    const [themAudio, setThemAudio] = useState<any>();
    const [themVideo, setThemVideo] = useState<any>();
    const [myVideo, setMyVideo] = useState<any>();
    const rtcClientRef = useRef<IAgoraRTCClient>();
    const [room, setRoom] = useState<any>();
    const [initialize, setInitialize] = useState(false)
    const [roomId, setRoomId] = useState('')
    const socket: any = useSocket();

    function getRandomRoom(userIdfn: any) {
        return new Promise((resolve, reject) => {
            socket.emit('addToRoom', { status: 'waiting', userId: userIdfn })
            socket.on('addToRoomResponse', (response: any) => {
                resolve(response)
            })
        })
    }
    function setRoomToWaiting(roomId: any) {
        return new Promise((resolve, reject) => {
            socket.emit('setRoomToWaiting', { roomId }, (response: any) => {
                resolve(response)
            })
        })
    }

    function createRoom(userId: any) {
        return new Promise((resolve, reject) => {
            socket.emit('createRoom', { userId: userId })
            socket.on('createRoomResponse', (response: any) => {
                resolve(response)
            })
        })
    }
    function handleNextClick() {
        connectToARoom();
    }

    async function connectToAgoraRtm(
        roomId: string,
        userId: string,
        onMessage: (message: any) => void,
        token: string
    ) {
        // const { default: AgoraRTM } = await import("agora-rtm-sdk");
        const client = AgoraRTM.createInstance(APP_ID);
        await client.login({
            uid: localuserId,
            token,
        });
        const channel = await client.createChannel(roomId);
        await channel.join();
        channel.on("ChannelMessage", (message, userId) => {
            onMessage({
                userId,
                message: message.text,
            });
        });

        return {
            channel,
        };
    }

    async function connectToAgoraRtc(
        roomId: string,
        userId: string,
        onVideoConnect: any,
        onWebcamStart: any,
        onAudioConnect: any,
        token: string
    ) {
        const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");

        const client = AgoraRTC.createClient({
            mode: "rtc",
            codec: "vp8",
        });

        await client.join(
            APP_ID,
            roomId,
            token,
            userId
        );
        console.log("@@@@@@", client)
        client.on("user-published", (themUser, mediaType) => {
            client.subscribe(themUser, mediaType).then(() => {
                if (mediaType === "video") {
                    onVideoConnect(themUser.videoTrack);
                }
                if (mediaType === "audio") {
                    onAudioConnect(themUser.audioTrack);
                    themUser.audioTrack?.play();
                }
            });
        });

        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        onWebcamStart(tracks[1]);
        await client.publish(tracks);

        return { tracks, client };
    }



    async function connectToARoom() {
        setThemAudio(undefined);
        setThemVideo(undefined);
        setMyVideo(undefined);
        setMessages([]);

        if (channelRef.current) {
            await channelRef.current.leave();
        }

        if (rtcClientRef.current) {
            rtcClientRef.current.leave();
        }

        const { rooms, rtcToken, rtmToken } = await getRandomRoom(localuserId);

        if (room) {
            setRoomToWaiting(room._id);
        }
        if (rooms.length > 0) {
            setRoom(rooms[0]);
            const { channel } = await connectToAgoraRtm(
                rooms[0]._id,
                localuserId,
                (message: any) => setMessages((cur: any) => [...cur, message]),
                rtmToken
            );
            channelRef.current = channel;
                console.log("!!!!!!!!!!!!!!!!!!!")
            const { tracks, client } = await connectToAgoraRtc(
                rooms[0]._id,
                localuserId,
                (themVideo: IRemoteVideoTrack) => setThemVideo(themVideo),
                (myVideo: ICameraVideoTrack) => setMyVideo(myVideo),
                (themAudio: IRemoteAudioTrack) => setThemAudio(themAudio),
                rtcToken
            );
            rtcClientRef.current = client;
        } else {
            const { room, rtcToken, rtmToken } = await createRoom(localuserId);
            console.log("room", room, "33333",rtcToken, "@@@@@@",rtmToken)
            setRoom(room);

            const { channel } = await connectToAgoraRtm(
                room._id,
                localuserId,
                (message: any) => setMessages((cur: any) => [...cur, message]),
                rtmToken
            );
            channelRef.current = channel;
            console.log("*******************8")

            const { tracks, client } = await connectToAgoraRtc(
                room._id,
                localuserId,
                (themVideo: IRemoteVideoTrack) => setThemVideo(themVideo),
                (myVideo: ICameraVideoTrack) => setMyVideo(myVideo),
                (themAudio: IRemoteAudioTrack) => setThemAudio(themAudio),
                rtcToken
            );
            rtcClientRef.current = client;
        }
    }
    // connectToARoom()
    /* useEffect(() => {
        console.log("#######",location.state.userId)
    }, []); */
    /* useEffect(() => {
        console.log("useSocket", socket)
        if (initialize) {
            socket.emit("addToRoom", { status: 'waiting', userId: userId })
            socket.on('addToRoomResponse', (response: any) => {
                setRoomId(response.roomId)
            })

        }
        setInitialize(true)
    }, [initialize]) */

    useEffect(() => {
        setLocaluserId(location.state.userId)
        if (localuserId) {
            connectToARoom();

        }
        return () => {
            socket.emit('leaveRoom', { roomId: room })
        }
    }, [localuserId]);


    function convertToYouThem(message: any) {
        return message.localuserId === localuserId ? "You" : "Them";
    }

    async function handleSubmitMessage(e: React.FormEvent) {
        e.preventDefault();
        await channelRef.current?.sendMessage({
            text: input,
        });
        setMessages((cur: any) => [
            ...cur,
            {
                localuserId,
                message: input,
            },
        ]);
        setInput("");
    }
    const isChatting = room!!;

    return (
        <div>
        <main>
            {isChatting ? (
                <>
                <div className='header-container'>
                    <h2>Omegle</h2>
                <button className='custom-button' onClick={handleNextClick}>Next</button>
                </div>
                    
                    <div className="chat-window">
                        <div className="video-panel">
                            <div className="video-container">
                                {myVideo && (
                                    <VideoPlayer
                                        style={{ width: '100%', height: '100%' }}
                                        videoTrack={myVideo}
                                    />
                                )}
                            </div>
                            <div className="video-container">
                                {themVideo && (
                                    <VideoPlayer
                                        style={{ width: '100%', height: '100%' }}
                                        videoTrack={themVideo}
                                    />
                                )}
                            </div>
                        </div>
    
                        <div className="chat-panel">
                            <ul>
                                {messages.map((message: any, idx: any) => (
                                    <li key={idx}>
                                        {convertToYouThem(message)} - {message.message}
                                    </li>
                                ))}
                            </ul>
    
                            <form onSubmit={handleSubmitMessage}>
                                <input className="button-input"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button className='custom-button'>Submit</button>
                            </form>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <button className='custom-button' onClick={() => setIsChatting(true)}>Start Chatting</button>
                </>
            )}
        </main>
    </div>
    
    );
};

export default VideoCall;

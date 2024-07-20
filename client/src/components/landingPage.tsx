import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { io } from "socket.io-client";
import { useSocket } from "./socketProvider"; 

const LandingPage = () => {
    const [initialize,setInitialize] = useState(false)
    // const [roomId,setRoomId] = useState('')
    const [userId] = useState( Math.random().toString(36).substr(2, 9) + '-' + Date.now());
    // const socket:any = useSocket();
/*     useEffect(() => {
        console.log("useSocket",socket)
        if(initialize){
            socket.emit("addToRoom",{ status: 'waiting',userId:userId })
            socket.on('addToRoomResponse',(response:any)=>{
                setRoomId(response.roomId)
            })

        }
        setInitialize(true)
    },[initialize]) */
    var navigate = useNavigate();
    
    const handleJoin =()=>{
        navigate('/video',{state:{userId:userId}})
    }
    return (
        <div >
            <button  onClick={handleJoin}>Join Room</button>
        </div>
    );
};

export default LandingPage
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { io } from "socket.io-client";
import { useSocket } from "./socketProvider"; 

const LandingPage = () => {
    const [initialize,setInitialize] = useState(false)
    const [userId] = useState( Math.random().toString(36).substr(2, 9) + '-' + Date.now());

    var navigate = useNavigate();
    
    const handleJoin =()=>{
        navigate('/video',{state:{userId:userId}})
    }
    return (
        <div  style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',width:'100vw',backgroundColor:'white'}}>
            <button className="custom-button" onClick={handleJoin}>Join Room</button>
        </div>
    );
};

export default LandingPage
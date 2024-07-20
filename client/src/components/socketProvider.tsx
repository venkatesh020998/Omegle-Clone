import { useMemo, createContext, useContext } from 'react'
import { io } from "socket.io-client";

const SocketContext = createContext(null)

export const useSocket = () => {
   var socket =  useContext(SocketContext)  
   return  socket  
}

export const SocketProvider = (props: any) => {
    const socket = useMemo(() => io("http://localhost:3000"), [])
    return (
        <SocketContext.Provider value={socket}>
            {props.children}
        </SocketContext.Provider>
    )
}
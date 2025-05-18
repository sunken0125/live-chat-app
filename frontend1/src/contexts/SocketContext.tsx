"use client";
import { useState, useEffect, useRef, createContext, useContext,ReactNode } from 'react';
import { io, Socket } from "socket.io-client";
import { useAuth } from "./authContext";
import { useRouter } from "next/navigation";

type SocketContextType = {
  rooms: string[];
  socket: Socket | null;
  username: string;
  roomMembers: string[];
  setRoomMembers: React.Dispatch<React.SetStateAction<string[]>>;
  isConnected:boolean;
};

const SocketContext = createContext<SocketContextType | null>(null);

type Props = {
  children: ReactNode;
};

export const SocketProvider = ({ children }: Props) => {
  const { accessToken, loading, refreshAccessToken } = useAuth();
  const [rooms, setRoom] = useState<string[]>([]);
  const [roomMembers, setRoomMembers] = useState<string[]>([]);
  const [username, setUsername] = useState<string>("");
  const socketRef = useRef<Socket | null>(null);
  const [socketState, setSocketState] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && accessToken) {
      const newSocket: Socket = io("https://live-chat-app-jf3p.onrender.com/", {
        auth: {
          token: accessToken,
        },
        autoConnect: false,
        withCredentials: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socketRef.current = newSocket;
      setSocketState(newSocket);
      newSocket.connect();

      newSocket.on("connect", () => {
        console.log("socket connected", newSocket.id);
        setIsConnected(true);
        newSocket.on("get-user", (name: string) => {
          setUsername(name);
        });

        newSocket.on(
          "room-joined",
          ({ roomId, users }: { roomId: string; users: string[] }) => {
            setRoom((prevRooms) => [...prevRooms, roomId]);
            console.log(`joint room is ${roomId}`);
            setRoomMembers(users);
            console.log(`users are ${users}`);
            router.push(`/chat/${roomId}`);
          }
        );
      });

      newSocket.on("connect_error", async (err) => {
        console.error("Socket connect_error:", err.message);
        try {
          console.log("resolving connect error and generating token");
          const newToken = await refreshAccessToken();
          (newSocket.auth as { token: string }).token = newToken;
          newSocket.disconnect();
          setTimeout(() => {
            newSocket.connect();
            setSocketState(newSocket);
          }, 100);
        } catch (refreshErr) {
          console.error("Token refresh failed on connect_error");
        }
      });

      newSocket.on("reconnect_attempt", async () => {
        try {
          console.log("trying to reconnect and generating token");
          const newToken = await refreshAccessToken();
          (newSocket.auth as { token: string }).token = newToken;
          newSocket.disconnect();
          setTimeout(() => {
            newSocket.connect();
            setSocketState(newSocket);
          }, 100);
        } catch (err) {
          console.error("Failed to refresh token on reconnect_attempt");
        }
      });

      newSocket.on("disconnect", async () => {
        console.log("socket disconnected", newSocket?.id);
        setIsConnected(false);
        setSocketState(null);

        try {
          console.log("Attempting reconnect after disconnect");
          const newToken = await refreshAccessToken();
          (newSocket.auth as {token:string}).token = newToken;
      
          setTimeout(() => {
            newSocket.connect();
            setSocketState(newSocket);
          }, 100);
        } catch (err) {
          console.error("Failed to refresh token on disconnect");
        }
      });

      return () => {
        newSocket?.disconnect();
        setSocketState(null);
        socketRef.current = null;
      };
    }
  }, [accessToken, loading, refreshAccessToken]);

  return (
    <SocketContext.Provider
      value={{ rooms, socket: socketState, username, roomMembers, setRoomMembers ,isConnected}}
    >
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
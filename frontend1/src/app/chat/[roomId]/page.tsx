"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute ,useAuth} from "@/contexts/authContext";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/contexts/SocketContext";

export default function ChatPage() {
  type User = {
    _id: string;
    username: string;
  };

  type Message = {
    _id: string;
    text: string;
    senderId: User;
    timestamp: string;
  };

  const { roomId } = useParams();
  const { rooms, socket, username, roomMembers, setRoomMembers, isConnected } = useSocket();
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [sentMessage, setSentMessage] = useState('');
  const {refreshAccessToken} = useAuth();
  const router = useRouter();

  const handleBack = () => {
    router.push('/chat');
  };

  useEffect(() => {
    if (socket && !socket.connected && isConnected === false) {
      console.log("Socket not connected in ChatPage, forcing reconnect");
      const reconnect = async () => {
        const newToken = await refreshAccessToken();
        (socket.auth as { token: string }).token = newToken;
        socket.connect();
      };
      reconnect();
    }
  }, [socket, isConnected]);


  // Rejoin room and THEN fetch chat
  useEffect(() => {
    if (!socket || !roomId || !isConnected) return;
    console.log("hello from ChatPage useEffect [socket, roomId, isConnected]");
    socket.emit("reconnect-room", roomId);
    const handleReady = (data: { username: string }) => {
      console.log("Socket ready. Username:", data.username);
      console.log("Attempting to rejoin room:", roomId);
      socket.emit("reconnect-room", roomId);
    };
  
    const handleReconnection = (users: string[]) => {
      console.log("Reconnected to room. Members:", users);
      setRoomMembers(users);
      socket.emit("get-chat", roomId);
    };
  
    socket.on("ready", handleReady);
    socket.on("on-reconnection", handleReconnection);
  
    return () => {
      if (socket){
        console.log("Cleaning up ChatPage useEffect [socket, roomId, isConnected]");
        socket.off("ready", handleReady);
        socket.off("on-reconnection", handleReconnection);
      }
    };
  }, [socket, roomId, isConnected,setRoomMembers]);
  



  useEffect(() => {
    if (!socket || !roomId || !isConnected) return;

    const handleChatHistory = (messages: Message[]) => {
      console.log("Received chat history");
      setAllMessages(messages);
    };

    socket.on("chat-history", handleChatHistory);

    return () => {
      if (socket){
        console.log("Cleaning up ChatPage useEffect [socket, roomId, isConnected] for chat-history");
        socket.off("chat-history", handleChatHistory);
      }
    };
  }, [socket, roomId,isConnected]);


  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (populatedMessage: Message) => {
      console.log("New message received:", populatedMessage.text);
      setAllMessages((prev) => [...prev, populatedMessage]);
    };

    socket.on("message", handleIncomingMessage);

    return () => {
      if (socket){
        console.log("Cleaning up ChatPage useEffect [socket] for message");
        socket.off("message", handleIncomingMessage);
      }
    };
  }, [socket]);

  useEffect(() => {
    console.log("Socket connected:", socket?.connected);
    console.log("isConnected state:", isConnected);
    console.log("Room ID:", roomId);
  }, [socket, isConnected, roomId]);


  const handleSend = () => {
    if (!socket || !sentMessage.trim()) return; 
    socket?.emit("message", { text: sentMessage, roomId });
    setSentMessage('');
  };

  const otherUser =
    roomMembers.length === 2
      ? username === roomMembers[0]
        ? roomMembers[1]
        : roomMembers[0]
      : "Loading...";

  return (
    <ProtectedRoute>
      <div>
        <h2>Hey {username}, Let's chat!!</h2>
        <h5>You are in a room with {otherUser}</h5>

        <input
          value={sentMessage}
          onChange={(e) => setSentMessage(e.target.value)}
          placeholder="Enter your message"
        />
        <button onClick={handleSend}>Send</button>

        <p>Messages:</p>
        <div>
          {allMessages.map((msg) => (
            <div key={msg._id}>
              <div>
                {msg.senderId.username} — {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
              <div>{msg.text}</div>
            </div>
          ))}
        </div>

        <br />
        <button onClick={handleBack}>Back</button>
      </div>
    </ProtectedRoute>
  );
}

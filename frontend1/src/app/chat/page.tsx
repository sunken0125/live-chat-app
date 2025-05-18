"use client";
import { useRouter } from "next/navigation";
import {useState,useEffect} from 'react';
import {ProtectedRoute, useAuth} from '../../contexts/authContext';
import {useSocket} from '../../contexts/SocketContext';

export default function Chat() {
  
  const [newUser,setNewUser]= useState('');
  

  const {logout}= useAuth();
  const {rooms,socket,username,roomMembers}= useSocket();
  const router= useRouter();

  

  const handleJoin = async ()=>{
    if(!socket) return;

    try
    {
      socket.emit('join-room',newUser);
    setNewUser('');
    }catch(err){
    console.error(err);
    }
    
  }

  
  
  const handleClick = async () => {
    try {
      logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };
  
  return (
    <ProtectedRoute>
      <div>
      
      <h2>Hey {username}, {"Let's chat!!"}</h2>
      
      <input value={newUser} onChange={(e)=>setNewUser(e.target.value)} placeholder="enter Username"></input>
      <button onClick={handleJoin}>Search</button>
      <br/>
      
      <button onClick={handleClick}>logout</button>
    </div>
    </ProtectedRoute>
    
  )
}

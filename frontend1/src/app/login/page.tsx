"use client";

import React from 'react'
import { useState , useEffect} from 'react'
import {useAuth} from '../../contexts/authContext';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    const [valid,setValid] = useState(true);
    const {accessToken,loading,login}= useAuth();
    const router = useRouter();

    

    useEffect(()=>{
        if(!loading && accessToken){
            router.push('/chat');
        }
    },[accessToken,loading]);

    if(loading || accessToken) return null;
    
      const handleSubmit = async (e) => {
        e.preventDefault();
        if(username==='' || password===''){
             setValid(false);
        }
        setUsername("");
        setPassword("");
        try {
          await login(username,password);
          router.push('/chat');
          
        } catch (error) {
          console.error('Error creating user:', error.message);
          
        }
      };
     
  

  return (
    <div>
        <h1>Enter the login details</h1>
        <form>
            <label htmlFor="username">Username:</label>
            <input value={username} type="text" id="username" name="username" placeholder='username...' onChange={(e)=>setUsername(e.target.value)} required /><br/>
            <label htmlFor="password">Password:</label>
            <input value={password} type="password" id="password" name="password" placeholder='password....' onChange={(e)=>setPassword(e.target.value)} required /><br/>
            {!valid && (
            <h2>please enter the username and password correctly</h2>
            )}
            <button type="submit" onClick={handleSubmit}>Login</button><br/>
            
            </form>
    </div>
  )
}

"use client";
import { useState, useEffect, FormEvent} from 'react';
import React from 'react'
import api from '../../lib/api'
import { useAuth } from '@/contexts/authContext';
import {useRouter} from 'next/navigation';

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const {accessToken,loading}= useAuth();
    const [mounted,setMounted]= useState(false);
    const router= useRouter();
    useEffect(() => {
        setMounted(true);
    },[]);
    useEffect(()=>{
            if(!loading && accessToken){
                router.push('/chat');
            }
        },[accessToken,loading,router]);
   
      const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUsername("");
        setPassword("");
        try {
          const res = await api.post('/register', { username, password });
          console.log('User created:', res.data.message);
          
        } catch (error:unknown) {
          if (error instanceof Error) {
          console.error('Error logging in:', error.message);
          } else {
            console.error('Error logging in:', error);
          }
          
        }
      };
     

      if (!mounted) return null;

  return (
    <div>
        <h1>Enter the login details</h1>
        <form onSubmit={handleSubmit}>
            <label htmlFor="username">Username:</label>
            <input value={username} type="text" id="username" name="username" placeholder='username...' onChange={(e)=>setUsername(e.target.value)} required /><br/>
            <label htmlFor="password">Password:</label>
            <input value={password} type="password" id="password" name="password" placeholder='password....' onChange={(e)=>setPassword(e.target.value)} required /><br/>
            <button type="submit" >Register</button><br/>
            <p>Already have an account? <a href="/login">Login here</a></p>
            </form>
    </div>
  )
}

"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../../contexts/authContext';
import { useRouter } from 'next/navigation';

export default function Login(){
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [valid, setValid] = useState<boolean>(true);
  const { accessToken, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && accessToken) {
      router.push('/chat');
    }
  }, [accessToken, loading, router]);

  if (loading || accessToken) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (username === '' || password === '') {
      setValid(false);
      return;
    }

    try {
      await login(username, password);
      router.push('/chat');
    } catch (error: unknown) {
  if (error instanceof Error) {
    console.error('Error logging in:', error.message);
  } else {
    console.error('Error logging in:', error);
  }
}finally {
      setUsername('');
      setPassword('');
    }
  };

  return (
    <div>
      <h1>Enter the login details</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input
          value={username}
          type="text"
          id="username"
          name="username"
          placeholder="username..."
          onChange={(e) => setUsername(e.target.value)}
          required
        /><br />
        
        <label htmlFor="password">Password:</label>
        <input
          value={password}
          type="password"
          id="password"
          name="password"
          placeholder="password...."
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />
        
        {!valid && <h2>Please enter the username and password correctly</h2>}
        
        <button type="submit">Login</button><br />
      </form>
    </div>
  );
}

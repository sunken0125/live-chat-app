import axios from "axios";

const api = axios.create({
    baseURL: 'https://live-chat-app-jf3p.onrender.com/', 
    timeout: 5000,
    withCredentials:true,
    headers: { 
        'Content-Type': 'application/json' ,
    }
  }); 
  
  export default api;
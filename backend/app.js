const express = require("express");
const mongoose = require("mongoose");
const cookieParser= require('cookie-parser');
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Auth= require("./models/Auth");
const Message= require("./models/Message");
const Rooms= require("./models/Rooms");

const app = express();
const server= http.createServer(app);
const io= new Server(server,{
    cors:{
        origin: 'http://localhost:3000',
        methods: ['GET','POST'],
        credentials: true,
    }
});

app.use(cors(
    { origin: 'http://localhost:3000' ,
        credentials:true,
    }
));
app.use(express.json());
app.use(cookieParser());



const JWT_access_SECRET_KEY="dragon";
const JWT_refresh_SECRET_KEY="ballz";

mongoose.connect("mongodb+srv://sankarshan125:sunken@cluster0.7hy0c.mongodb.net/livechat?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => {
        server.listen(4000, () => console.log("Server running on port 4000"));
        console.log("Connected to DB");
    })
    .catch((err) => console.log(err));




function generateAccessToken(user) {
    console.log('new accesss token created');
    return jwt.sign({ _id: user._id }, JWT_access_SECRET_KEY, { expiresIn: '1m' });
}

function generateRefreshToken(user){
    console.log('new refresh token created');
    return jwt.sign({ _id: user._id }, JWT_refresh_SECRET_KEY, { expiresIn: '30d' });
}

app.get('/ping',(req,res)=>{
  res.send('server is alive')
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log('Received data:', username, password); 
  try {
    const existingUser = await Auth.findOne({ username });
    if (existingUser) {
      console.log('User already exists');
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Auth({ username, password: hashedPassword });
    await newUser.save();
    console.log('User created:', newUser);
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error('Registration failed:', error); 
    return res.status(500).json({ error: "Registration failed" });
  }
});


app.post('/login',async  (req,res)=>{
    const { username, password } = req.body;
    console.log('Received data:', username, password); 
    try{
        const user = await Auth.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: " Invalid credentials " });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie('refreshToken',refreshToken,{
            httpOnly: true, 
            secure: true, 
            sameSite: 'Strict',
            path: '/refresh-token',
            maxAge: 30*24*60*60*1000,
        });
        return res.status(200).json({ accessToken });
    }catch(error){
        return res.status(403).json({ error: "Invalid refresh-token" });
    }

});

app.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        return res.status(401).json({error:'refresh token missing'}); 
    }
    try {
        const payload= jwt.verify(refreshToken,JWT_refresh_SECRET_KEY);
        const accessToken= generateAccessToken({_id: payload._id});
        console.log('new token created');
        return res.json({accessToken});
    } catch (error) {   
        return res.status(403).json({error: 'Invalid refresh token'});
    }
});


app.post('/logout',(req,res)=>{
    res.clearCookie('refreshToken',{
        httpOnly: true, 
        secure: true, 
        sameSite: 'Strict',
        path: '/refresh-token',
    });
    res.status(200).json({message: 'Logged out'});
});

// In your server.js
// app.get('/test-auth', (req, res) => {
//     const authHeader = req.headers.authorization;
    
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ message: 'No token provided' });
//     }
    
//     const token = authHeader.split(' ')[1];
    
//     try {
//       const decoded = jwt.verify(token, JWT_access_SECRET_KEY);
//       res.json({ message: 'Authentication successful', userId: decoded._id });
//     } catch (err) {
//       // This is where a 401 should be returned for expired tokens
//       console.log('Token verification failed:', err.message);
//       return res.status(401).json({ message: 'Invalid or expired token' });
//     }
//   });

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
      try {
      const user = jwt.verify(token, JWT_access_SECRET_KEY);
      socket.user = user;
      next();
    } catch (error) {
        console.log("in the error");
      next(new Error('Authentication failed'));
    }
  });
  
  io.on('connection', async (socket) => {
    try {
      const userId = socket.user._id;
      const userDoc = await Auth.findById(userId);
      const messages= await Message.find({senderId:userId});
      const rooms= await Rooms.find({members:userId});
      const members=[];
      
      rooms.forEach((room)=>{
        console.log(`joining room ${room._id.toString()}`)
        socket.join(room._id.toString())
    });
  
      if (!userDoc) {
        console.log(`User not found in DB for id: ${userId}`);
        return;
      }
  
      console.log(`User connected: ${userDoc.username}`);
      socket.emit('get-user',userDoc.username);
  
      socket.on('message', async ({text,roomId}) => {
        if (!text || text.trim() === '') {
          console.log('Empty message not sent');
          return; 
        }

        console.log(`${text} from ${userDoc.username}`);
        const newMessage= new Message({text,senderId:userId,roomId:roomId});
        await newMessage.save();

        const populatedMessage = await newMessage.populate('senderId', 'username');
        io.to(roomId).emit('message', populatedMessage);

      });

      socket.on('get-chat',async (roomId)=>{
        try{
          const room = await Rooms.findById(roomId);
          if (!room) {
            return socket.emit('chat-history', { error: 'Room not found' });
          }

          const messages = await Message.find({ roomId })
          .sort({ timestamp: -1 }) // newest first
          .limit(50)
          .populate('senderId', 'username _id')
          .lean();
          messages.reverse();
          socket.emit('chat-history', messages);
        }catch(error){
          console.error('Error fetching chat history:', err);
          socket.emit('chat-history', { error: 'Failed to load messages' });
        }
      })

      socket.on('reconnect-room', async (roomId) => {
        try {
          console.log("reconnection...........................")
          const room = await Rooms.findById(roomId).populate('members', 'username');
          if (!room) {
            console.warn(`Room ${roomId} not found during reconnection.`);
            return;
          }
      
          const isMember = room.members.some(
            (member) => member._id.toString() === userId
          );
      
          if (!isMember) {
            console.warn(`User ${userDoc.username} not a member of room ${roomId}`);
            return;
          }
      
          socket.join(roomId);
          console.log(`${userDoc.username} rejoined room ${roomId}`);
      
          const usernames = room.members.map((user) => user.username);
          socket.emit('on-reconnection', usernames);
        } catch (err) {
          console.error('Error during room reconnection:', err);
        }
      });
      
      

      socket.on('join-room',async (newUser)=>{
        try {
            const searchUser= await Auth.findOne({username:newUser});
            if(!searchUser){
                throw new Error("User does not exist");
            }
            
            let room = await Rooms.findOne({
              members: { $all: [userId, searchUser._id], $size: 2 },
              isGroup: false,
            });
      
            if (!room) {
              room = await Rooms.create({
                members: [userId, searchUser._id],
                isGroup:false,
              });
              console.log(`creating room ${room._id.toString()}`);
            }

            const roomId= room._id.toString();
            socket.join(roomId);
            console.log(`${userDoc.username} has joined the room ${roomId}`);

            // Inform the other user to join the room too (if connected)
            const sockets = await io.fetchSockets();
            const otherSocket = sockets.find(s => s.user && s.user._id.toString() === searchUser._id.toString());

            if (otherSocket) {
            otherSocket.join(roomId);
            console.log(`${searchUser.username} also joined room ${roomId}`);
            }

            // Optionally, emit room joined confirmation to both
            socket.emit('room-joined', { roomId, users: [userDoc.username, searchUser.username] });


        }catch(error){
            socket.emit('error','not a member');
        }
        
        
      })

      socket.emit('ready', { username: userDoc.username });

    } catch (err) {
      console.error('Error fetching user:', err);
    }
  });
  
const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
    text: { type: String, required: true },
    senderId:{type:mongoose.Schema.Types.ObjectId,required:true,ref:'Auth'},
    roomId:{type:mongoose.Schema.Types.ObjectId,ref:'Rooms'},
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;

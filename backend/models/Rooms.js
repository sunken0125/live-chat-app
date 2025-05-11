const mongoose= require('mongoose');
const Schema= mongoose.Schema;
const roomSchema= new Schema({
    name: {
        type: String,
        default: null,             
      },
      isGroup: {
        type: Boolean,
        default: false,           
      },
      members: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Auth',              
          required: true,
        }
      ],
      
        
      
});

const Rooms= mongoose.model('Rooms',roomSchema);
module.exports= Rooms;

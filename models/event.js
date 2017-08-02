var mongoose = require("mongoose");

var eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required : true,
    },

    eventDate: {
        type: Date,
        required : true  
    },

    eventPending: {   //if true event has not yet fired
        type: Boolean,
        required : true, 
        default :false,      
    },
    // 0 - nie powtarzaj, 1 - co tydzien, 2 - co miesiac, 3 - co kwartał
    powtarzaj: {
        type: Number,
        required : true,
    },
   
    updateDate: {
        type: Date,
        default: Date.now,
        required : true        
    },    
});


var Event = mongoose.model('Event', eventSchema);
module.exports = Event;
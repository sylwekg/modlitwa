var mongoose = require("mongoose");

var globalSchema = new mongoose.Schema({
    name: {
        type: String,
        required : true,
    },

    powiadomienieEmail: {
        type: Boolean,
        required : true, 
        default :false,      
    },
    // 0 - nie powtarzaj, 1 - co tydzien, 2 - co miesiac, 3 - co kwartał
    powtarzaj: {
        type: Number,
        required : true,
    },

    dataZmiany: {
        type: Date,
        required : true        
    },    

    updateDate: {
        type: Date,
        default: Date.now,
        required : true        
    },    
});


var Global = mongoose.model('Global', globalSchema);
module.exports = Global;
var mongoose = require("mongoose");


var tajemnicaSchema = new mongoose.Schema({
    number: {
        type: Number,
        required : true,
        unique: true, 
    },
    name: {
        type: String,
        required : true,
        unique: true,       
    },
    updateDate: {
        type: Date,
        default: Date.now,
        required : true        
    },    
});


var Tajemnica = mongoose.model('Tajemnica', tajemnicaSchema);
module.exports = Tajemnica;
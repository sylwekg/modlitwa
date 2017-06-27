var mongoose = require("mongoose");
var Tajemnica = require('./tajemnica'); 
var Group = require('./group');

var Schema = mongoose.Schema;

var userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required : true,
        trim : true
    },
    name: {
        type: String,
        required : true,
        trim : true
    },
    tel: {
        type: String,
        required : true
    },
    tajemnica: { 
        type: Schema.Types.ObjectId, 
        ref: 'Tajemnica' 
    },
    grupa: { 
        type: Schema.Types.ObjectId, 
        ref: 'Group' 
    },
    joinDate: {
        type: Date,
        required : true        
    },
    updateDate: {
        type: Date,
        default: Date.now,       
        required : true        
    },   
    foto: {
        type: String
    },     
});


var User = mongoose.model('User', userSchema);
module.exports = User;
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var User = require('./user'); 

var groupSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required : true        
    },

    // todo: wielu opiekunow (relacja 1..n)

    opiekun:{ type: Schema.Types.ObjectId, ref: 'User' },   

    updateDate: {
        type: Date, 
        default: Date.now,
        required : true         
    },    
});


var Group = mongoose.model('Group', groupSchema);
module.exports = Group;
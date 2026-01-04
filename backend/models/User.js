import mongoose, { model, Schema } from 'mongoose';

const userSchema = new Schema({
    name : {type:String, required:true},
    email:{type:String, required:true, unique:true},
    password: {type:String, required:true},
    lastSeen: {
  type: Date,
  default: null
}


})

const User = model('User', userSchema);
export default User;
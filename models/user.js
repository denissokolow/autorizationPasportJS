const { Schema, model } = require('../conn');
const UserSchema = new Schema({
    "login": {
        "type": "String"
    },
    "password": {
        "type": "String"
    },
    "salt": {
        "type": "String"
    }
},
);
const u = model('User', UserSchema);
module.exports = { u };
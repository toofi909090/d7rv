
const mongoose = require('mongoose')

const image = mongoose.Schema({
    guildID: {
        type: mongoose.SchemaTypes.String,
    },
    img_url: {
        type: mongoose.SchemaTypes.String,
        default: null
    },
    img_url2: {
        type: mongoose.SchemaTypes.String,
        default: null
    },
    img_url3: {
        type: mongoose.SchemaTypes.String,
        default: null
    },
    
})

module.exports = mongoose.model('image-url', image)  
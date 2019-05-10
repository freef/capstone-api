const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  drawing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Draw',
    required: true
  },
  img: {
    type: String,
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toObject: {virtuals: true}
})

commentSchema.virtual('username', {
  ref: 'User',
  localField: 'owner',
  foreignField: '_id'
})

module.exports = mongoose.model('Comment', commentSchema)

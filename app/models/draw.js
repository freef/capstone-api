const mongoose = require('mongoose')

const drawSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  img: {
    type: String,
    required: true
  },
  imagekey: {
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

drawSchema.virtual('likeTotal').get(function () {
  return this.likes.length
})

drawSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'blog'
})

drawSchema.virtual('username', {
  ref: 'User',
  localField: 'owner',
  foreignField: '_id'
})

drawSchema.virtual('score').get(function () {
  const now = Date.now()
  const likeAdjust = this.likeTotal * 3600000
  return (now - this.createdAt) - likeAdjust
})

module.exports = mongoose.model('Draw', drawSchema)

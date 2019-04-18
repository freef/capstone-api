const express = require('express')
const passport = require('passport')
const Draw = require('../models/draw')
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })
const router = express.Router()
const Comment = require('../models/comment')
const multer = require('multer')
const upload = multer({dest: 'uploads/', storage: multer.memoryStorage()})
const promiseS3Upload = require('../../lib/s3Upload.js')
// const promiseS3Delete = require('../../lib/s3Delete.js')

// INDEX
router.get('/drawings', (req, res, next) => {
  Draw.find().populate('comments').populate('username', 'username').populate({path: 'comments', populate: {path: 'username', select: 'username'}})
    .then(drawings => {
      return drawings.map(draw => draw.toObject())
    })
    .then(drawings => res.status(200).json({ draw: drawings }))
    .catch(next)
})

// SHOW
router.get('/drawings/:id', (req, res, next) => {
  Draw.findById(req.params.id).populate('comments').populate('username', 'username').populate({path: 'comments', populate: {path: 'username', select: 'username'}})
    .then(handle404)
    .then(draw => res.status(200).json({ draw: draw.toObject() }))
    .catch(next)
})

// CREATE
router.post('/drawings', requireToken, upload.single('image'), (req, res, next) => {
  req.body.data.owner = req.user.id
  const newDrawing = req.body.data
  promiseS3Upload(req.body.data.img)
    .then(awsResponse => {
      newDrawing.img = awsResponse.Location
      newDrawing.imagekey = awsResponse.Key
      return Draw.create(newDrawing)
    })
    .then(draw => {
      res.status(201).json({ draw: draw.toObject() })
    })
    .catch(next)
})

// UPDATE
router.patch('/drawings/:id', requireToken, removeBlanks, (req, res, next) => {
  delete req.body.data.owner
  Draw.findById(req.params.id)
    .then(handle404)
    .then(draw => {
      const drawObj = draw.toObject()
      const updateDrawing = {...drawObj}
      requireOwnership(req, drawObj)
      promiseS3Upload(req.body.data.img)
        .then(awsResponse => {
          updateDrawing.img = awsResponse.Location
          updateDrawing.imagekey = awsResponse.Key
          updateDrawing.title = req.body.data.title
          return draw.update(updateDrawing)
        })
        .then(() => res.sendStatus(204))
        .catch(next)
    })
})

// DESTROY
router.delete('/drawings/:id', requireToken, (req, res, next) => {
  Draw.findById(req.params.id)
    .then(handle404)
    .then(draw => {
      const id = draw
      requireOwnership(req, draw)
      Comment.deleteMany({draw: id}, (err, res) => { if (err) { throw err } })
      draw.remove()
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

// Likes Routes
// // UPDATE
router.patch('/likes/:id', requireToken, removeBlanks, (req, res, next) => {
  const liker = req.body.user._id
  delete req.body
  Draw.findById(req.params.id)
    .then(handle404)
    .then(draw => {
      const hasLiked = draw.likes.some(like => {
        return like.toString() === liker
      })
      if (hasLiked) {
        return draw.update({$pull: {likes: liker}})
      } else {
        return draw.update({$push: {likes: liker}})
      }
    })
    .then(draw => {
      res.sendStatus(204)
    })
    .catch(next)
})

module.exports = router

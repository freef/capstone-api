const express = require('express')
const passport = require('passport')
const Comment = require('../models/comment')
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })
const router = express.Router()
const multer = require('multer')
const upload = multer({dest: 'uploads/', storage: multer.memoryStorage()})
const promiseS3Upload = require('../../lib/s3Upload.js')
// const promiseS3Delete = require('../../lib/s3Delete.js')

// INDEX
router.get('/comments', (req, res, next) => {
  Comment.find().populate('username', 'username')
    .then(comments => {
      return comments.map(comment => comment.toObject())
    })
    .then(comments => res.status(200).json({ comment: comments }))
    .catch(next)
})

// SHOW
router.get('/comments/:id', (req, res, next) => {
  Comment.findById(req.params.id).populate('username', 'username')
    .then(handle404)
    .then(comment => res.status(200).json({ comment: comment.toObject() }))
    .catch(next)
})

// CREATE
router.post('/comments', requireToken, upload.single('image'), (req, res, next) => {
  req.body.data.owner = req.user.id
  const newCommenting = req.body.data
  promiseS3Upload(req.body.data.img)
    .then(awsResponse => {
      newCommenting.img = awsResponse.Location
      newCommenting.imagekey = awsResponse.Key
      return Comment.create(newCommenting)
    })
    .then(comment => {
      res.status(201).json({ comment: comment.toObject() })
    })
    .catch(next)
})

// UPDATE
router.patch('/comments/:id', requireToken, removeBlanks, (req, res, next) => {
  delete req.body.data.owner
  Comment.findById(req.params.id)
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
router.delete('/comments/:id', requireToken, (req, res, next) => {
  Comment.findById(req.params.id)
    .then(handle404)
    .then(comment => {
      const id = comment
      requireOwnership(req, comment)
      Comment.deleteMany({comment: id}, (err, res) => { if (err) { throw err } })
      comment.remove()
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

router.patch('/likescomment/:id', requireToken, removeBlanks, (req, res, next) => {
  const liker = req.body.user._id
  delete req.body
  console.log(req.params.id)
  Comment.findById(req.params.id)
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

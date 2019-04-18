const AWS = require('aws-sdk')

// require dotenv to configure environment variables
require('dotenv').config()

let s3 = new AWS.S3()
// wrappee function to return a promise from s3 upload
// receives file from multer which attaches request to objexty
const promiseS3Delete = function (data) {
  return new Promise((resolve, reject) => {
    // build params from the req.file the params are wht the aws docs specified are necessary
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `${data.imagekey}`
    }
    // make request to aws
    s3.deleteObject(params, function (err, data) {
      if (err) { reject(err) } else { resolve(data) }
    })
  })
}
//
// let s3 = new AWS.S3()
// const s3Delete = function (data) {
//   // build params from the req.file the params are wht the aws docs specified are necessary
//   const params = {
//     Bucket: process.env.BUCKET_NAME,
//     Key: `mattfwdi/${data}`
//   }
//   console.log(data)
//   s3.deleteObject(params, function (err, data) {
//     if (err) { throw err } else { return data }
//   })
// }

module.exports = promiseS3Delete

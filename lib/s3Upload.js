const AWS = require('aws-sdk')

// require dotenv to configure environment variables
require('dotenv').config()

let s3 = new AWS.S3()
// wrappee function to return a promise from s3 upload
// receives file from multer which attaches request to objexty
const promiseS3Upload = function (dataURL) {
  return new Promise((resolve, reject) => {
    // build params from the req.file the params are wht the aws docs specified are necessary
    const buf = Buffer.from(dataURL.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `${Date.now()}`,
      Body: buf,
      ACL: 'public-read',
      ContentEncoding: 'base64',
      ContentType: 'image/png'
    }
    // make request to aws
    s3.upload(params, function (err, data) {
      if (err) { reject(err) } else { resolve(data) }
    })
  })
}

module.exports = promiseS3Upload

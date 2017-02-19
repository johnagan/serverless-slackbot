'use strict'

const
  TABLE_NAME = process.env.TABLE_NAME,
  TOPIC_NAME = process.env.TOPIC_NAME,
  AWS_REGION = process.env.AWS_REGION

const
  AWS = require('aws-sdk'),
  debug = require('debug')('aws')


/**
 * Get account id
 * 
 * @return {Promise} A Promise with the account id
 */
exports.getId = function() {
  let iam = new AWS.IAM()

  let authorized = data => data.User.Arn
  let unauthorized = error => error.message
  let match = arn => arn.match(/arn:aws:sts::(\d+):/)[1]

  return iam.getUser({}).promise().then(authorized).catch(unauthorized).then(match)
}


exports.notify = function(payload) {
  let sns = new AWS.SNS()

  let getParams = id => {
    return {
      Message: JSON.stringify(payload),
      TopicArn: `arn:aws:sns:${AWS_REGION}:${id}:dispatcher`
    }
  }

  return this.getId().then(getParams).then(params => {
    return sns.publish(params).promise()
  })
}


/**
 * Get a record from the database
 * 
 * @param {String} team_id - The team id
 * @return {Promise} A Promise with the record
 */
exports.get = function(team_id) {
  debug('get %s', team_id)

  let params = {
    Key: { team_id: team_id },
    TableName: TABLE_NAME
  }

  let dynamo = new AWS.DynamoDB.DocumentClient()
  return dynamo.get(params).promise().then(record => {
    return Promise.resolve(record.Item)
  })
}


/**
 * Save a record
 *
 * @param {Object} record - The record to save
 * @return {Promise} A Promise with the save results
 */
exports.save = function(record) {
  debug('save %j', record)

  let params = {
    Item: record,
    TableName: TABLE_NAME
  }

  let dynamo = new AWS.DynamoDB.DocumentClient()
  return dynamo.put(params).promise()
}
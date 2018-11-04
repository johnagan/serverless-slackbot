![](https://camo.githubusercontent.com/547c6da94c16fedb1aa60c9efda858282e22834f/687474703a2f2f7075626c69632e7365727665726c6573732e636f6d2f6261646765732f76332e737667) ![](https://camo.githubusercontent.com/d59450139b6d354f15a2252a47b457bb2cc43828/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f6c2f7365727665726c6573732e737667)

# Serverless Slackbot
This project mimics the [Hubot](https://hubot.github.com/) model on Slack using a lot of buzz words including: Serverless.js, AWS API Gateway, AWS Lambda, AWS DynamoDB, AWS SNS, and Slack Events API.


## How It Works
Each custom script will run in it's own Lambda process, which is triggered by an SNS notification. Everything runs through a single Lambda handler, so you'll only see one function for everything.

* **OAUTH**: API Gateway > Lambda > DynamoDB > API Gateway (redirects)
* **Slack Events**: API Gateway > Lambda > DynamoDB > SNS
* **Custom Scripts**: SNS > Lambda > Custom Script


## Quick Start
1. Get [Serverless.js](https://github.com/serverless/serverless) setup
2. Create a [Slack App](https://api.slack.com/apps?new_app=1)
3. Update the [serverless.yml](serverless.yml) file with the Slack App info [[more info](https://github.com/johnagan/serverless-slack-app)]
4. Write a custom script in the [scripts folder](scripts)
5. Update the [scripts.json](scripts.json) file to include your script
6. Deploy :boom:

## Usage
Docs coming soon. [Check out the example](scripts/index.js) for now

## [Bot API](src/bot.js)
Docs coming soon...

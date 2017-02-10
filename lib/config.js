'use strict'

const dotenv = require('dotenv')
var path = require("path")
var appRootDir = require('app-root-dir').get();

const ENV = process.env.NODE_ENV || 'development'

dotenv.load()

console.log(`process.env.NODE_ENV=${process.env.NODE_ENV}`);

const envConfig = {
  ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  REPO_USERNAME: process.env.REPO_USERNAME,
  REPO_PASSWORD: process.env.REPO_PASSWORD,
  WHITELISTED_IPS: process.env.WHITELISTED_IPS,
}

const config = require('rc')("nginxGraph", envConfig);

if (ENV === 'development') {
	console.log(`config=${JSON.stringify(config, null, 4)}`)
}

module.exports = config;
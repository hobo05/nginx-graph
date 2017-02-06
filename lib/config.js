'use strict'

const dotenv = require('dotenv')
const ENV = process.env.NODE_ENV || 'development'

dotenv.load()

console.log(`process.env.NODE_ENV=${process.env.NODE_ENV}`);

const config = {
  ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  NGINX_CONF_REPO: process.env.NGINX_CONF_REPO,
  REPO_BRANCH: process.env.REPO_BRANCH,
  REPO_USERNAME: process.env.REPO_USERNAME,
  REPO_PASSWORD: process.env.REPO_PASSWORD,
  WHITELISTED_IPS: process.env.WHITELISTED_IPS
}

if (ENV === 'development') {
	console.log(`config=${JSON.stringify(config)}`)
}

module.exports = (key) => {
  if (!key) return config

  return config[key]
}
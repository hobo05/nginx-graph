'use strict'

const dotenv = require('dotenv')
const ENV = process.env.NODE_ENV || 'development'

if (ENV === 'development') dotenv.load()

const config = {
  ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  NGINX_CONF_REPO: process.env.NGINX_CONF_REPO,
  REPO_BRANCH: process.env.REPO_BRANCH,
  REPO_USERNAME: process.env.REPO_USERNAME,
  REPO_PASSWORD: process.env.REPO_PASSWORD
}

module.exports = (key) => {
  if (!key) return config

  return config[key]
}
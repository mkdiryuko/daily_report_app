// Update with your config settings.
require('dotenv').config({path: '.env.dev'});

module.exports = {

  development: {
    client: "mysql",
    connection: {
      database: "daily_report_app",
      user: "root",
      password: "yutozmt",
    },
    pool: {
      min: 2,
      max: 10
    },
  },

  staging: {
    client: "mysql",
    connection: {
      database: "daily_report_app",
      user: "root",
      password: "yutozmt",
    },
    pool: {
      min: 2,
      max: 10
    },
  },

  production: {
    client: "mysql",
    connection: {
      database: "daily_report_app",
      user: "root",
      password: "yutozmt",
    },
    pool: {
      min: 2,
      max: 10
    },
  }

};
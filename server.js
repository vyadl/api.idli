require('dotenv').config();

const createApp = async () => {
  global.echo = console.log;

  const express = require('express');
  const bodyParser = require('body-parser');
  const cors = require('cors');

  const app = express();

  const corsOptions = {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  };

  app.use(cors(corsOptions));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.all('/*', function(req, res, next) {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    
      res.end();
    }
  });

  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to idli application' })
  });

  require('./routes/auth.routes')(app);
  require('./routes/user.routes')(app);
  require('./routes/admin.routes')(app);
  require('./routes/list.routes')(app);
  require('./routes/item.routes')(app);

  const PORT = process.env.PORT || 8088;

  app.listen(PORT, () => {
    echo(`Server is running on port ${PORT}`);
  });

  const db = require('./models');
  const Role = db.role;
  const dbConnectionString = `${
      process.env.DB_PATH_PREFIX
    }${
      process.env.DB_USER
    }:${
      process.env.DB_PASS
    }@${
      process.env.DB_PATH
    }/${
      process.env.DB_NAME
    }?retryWrites=true&w=majority`;

  db.mongoose
    .connect(dbConnectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      echo('Successfully connect to MongoDB');
      initial();
    })
    .catch(err => {
      echo('Connection failed');
      echo(err);
      process.exit();
    });

  function initial() {
    Role.estimatedDocumentCount((err, count) => {
      if (!err && count === 0) {
        new Role({
          name: 'user',
        }).save(err => {
          if (err) {
            echo('error', err);
          }

          echo('added "user" to roles collection');
        });

        new Role({
          name: 'admin',
        }).save(err => {
          if (err) {
            echo('error', err);
          }

          echo('added "admin" to roles collection');
        });
      }
    })
  }
};

module.exports = createApp;

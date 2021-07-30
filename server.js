global.echo = console.log;

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

const corsOptions = {
  origin: '*',
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
const dbConfig = require('./config/db.config');
const Role = db.role;
echo('before connect to db');
db.mongoose
  .connect(`mongodb+srv://idli_user:111111aa@idli.pt3qg.mongodb.net/idli_db?retryWrites=true&w=majority`, {
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

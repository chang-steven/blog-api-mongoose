const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const jsonParser = bodyParser.json();

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {BlogPost} = require('./models');

const app = express();
app.use(bodyParser.json());
app.use(morgan('common'))

app.get('/posts', (req, res) => {
  BlogPost
  .find()
  .then(result => {
    res.json(
      {posts: result.map(
      result => result.apiRepr())
    }
  );
  })
  .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});
    });
});

app.get('/posts/:id', (req,res) => {
  BlogPost
  .findById(req.params.id)
  .then(result => res.json(result.apiRepr()))
  .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});
    });
});

app.post('/posts', jsonParser, (req,res) => {
  const requiredFields = ['author', 'content', 'title'];
  for (let i = 0; i < requiredFields.length; i++) {
    if (!(requiredFields[i] in req.body)) {
      const message = `Sorry, missing ${requiredFields[i]} in post`
      console.error(message);
      return res.status(400).send(message);
    };
  };
  BlogPost.
  create({
    author: {
      firstName: req.body.author.firstName,
      lastName: req.body.author.lastName
    },
    title: req.body.title,
    content: req.body.content
  })
  .then(result => res.status(201).json(result.apiRepr()))
  .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});

app.put('/posts/:id', jsonParser, (req, res) => {
  const requiredFields = ['id'];
  for (let i = 0; i < requiredFields.length; i++) {
    if (!(requiredFields[i] in req.body)) {
      const message = `Sorry, missing ${requiredFields[i]} in post`
      console.error(message);
      return res.status(400).send(message);
    };
  }
  if(!(req.params.id === req.body.id)) {
    const message = `Sorry, the requested id and the path id do not match`
    console.error(message);
    return res.status(400).send(message);
  };
  const toUpdate = {};
  const updateableFields = ['author', 'content', 'title'];

  for (let i = 0; i < updateableFields.length; i++) {
    if(updateableFields[i] in req.body) {
      let keyToUpdate = updateableFields[i];
      toUpdate[keyToUpdate] = req.body[keyToUpdate];
    }
  };
  console.log(toUpdate);
  // updateableFields.forEach(field => {
  //   if (field in req.body) {
  //     toUpdate[field] = req.body[field];
  //   }
  // });
  BlogPost
  .findByIdAndUpdate(req.params.id, {$set: toUpdate})
  .then(result => res.status(204).end())
  .catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.delete('/posts/:id', (req, res) => {
BlogPost
.findByIdAndRemove(req.params.id)
.then(result => res.status(204).end())
.catch(err => res.status(500).json({message: 'Internal server error'}));
})


let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};

const http = require('http');
const { MongoClient } = require('mongodb');
const url = require('url');

const PORT = 3000;

const mongoURI = 'mongodb+srv://romaananyev8_db_user:bIKsG3sw7EQQavDI@cluster0.yysdbcm.mongodb.net/?appName=Cluster0/BSTU';

const client = new MongoClient(mongoURI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000
});

let db;
let server;

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendResponse(res, statusCode, { error: message });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function validateFaculty(data) {
  if (!data.faculty || !data.faculty_name) {
    return 'Missing required fields: faculty, faculty_name';
  }
  if (typeof data.faculty !== 'string' || typeof data.faculty_name !== 'string') {
    return 'All fields must be strings';
  }
  return null;
}

function validatePulpit(data) {
  if (!data.pulpit || !data.pulpit_name || !data.faculty) {
    return 'Missing required fields: pulpit, pulpit_name, faculty';
  }
  if (typeof data.pulpit !== 'string' || typeof data.pulpit_name !== 'string' || typeof data.faculty !== 'string') {
    return 'All fields must be strings';
  }
  return null;
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.listCollections().toArray()
      .then(collections => {
        const collectionNames = collections.map(c => c.name);
        const promises = [];
        
        if (!collectionNames.includes('faculty')) {
          console.log('Creating "faculty" collection...');
          promises.push(db.createCollection('faculty'));
        }
        
        if (!collectionNames.includes('pulpit')) {
          console.log('Creating "pulpit" collection...');
          promises.push(db.createCollection('pulpit'));
        }
        
        return Promise.all(promises);
      })
      .then(() => {
        console.log('Database initialized successfully');
        resolve();
      })
      .catch(reject);
  });
}

function requestHandler(req, res) {
  const parsedUrl = url.parse(decodeURI(req.url), true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  if (!db) {
    return sendError(res, 503, 'Database not connected');
  }

  if (pathname === '/api/faculties' && method === 'GET') {
    db.collection('faculty').find().toArray()
      .then(faculties => {
        sendResponse(res, 200, faculties);
      })
      .catch(err => {
        console.error('GET /api/faculties error:', err);
        sendError(res, 500, 'Internal server error');
      });
  }

  else if (pathname === '/api/pulpits' && method === 'GET') {
    db.collection('pulpit').find().toArray()
      .then(pulpits => {
        sendResponse(res, 200, pulpits);
      })
      .catch(err => {
        console.error('GET /api/pulpits error:', err);
        sendError(res, 500, 'Internal server error');
      });
  }

  else if (pathname === '/api/faculties' && method === 'POST') {
    parseBody(req)
      .then(data => {
        const validationError = validateFaculty(data);
        if (validationError) {
          return Promise.reject({ status: 400, message: validationError });
        }

        return db.collection('faculty').findOne({ faculty: data.faculty })
          .then(existing => {
            if (existing) {
              return Promise.reject({ status: 409, message: `Faculty with code '${data.faculty}' already exists` });
            }
            return db.collection('faculty').insertOne({
              faculty: data.faculty,
              faculty_name: data.faculty_name
            });
          })
          .then(result => {
            sendResponse(res, 201, {
              _id: result.insertedId.toString(),
              faculty: data.faculty,
              faculty_name: data.faculty_name
            });
          });
      })
      .catch(err => {
        if (err.status) {
          sendError(res, err.status, err.message);
        } else if (err.message === 'Invalid JSON') {
          sendError(res, 400, 'Invalid JSON format');
        } else {
          console.error('POST /api/faculties error:', err);
          sendError(res, 500, 'Internal server error');
        }
      });
  }

  else if (pathname === '/api/pulpits' && method === 'POST') {
    parseBody(req)
      .then(data => {
        const validationError = validatePulpit(data);
        if (validationError) {
          return Promise.reject({ status: 400, message: validationError });
        }

        return db.collection('pulpit').findOne({ pulpit: data.pulpit })
          .then(existing => {
            if (existing) {
              return Promise.reject({ status: 409, message: `Pulpit with code '${data.pulpit}' already exists` });
            }
            return db.collection('faculty').findOne({ faculty: data.faculty });
          })
          .then(faculty => {
            if (!faculty) {
              return Promise.reject({ status: 400, message: `Faculty with code '${data.faculty}' does not exist` });
            }
            return db.collection('pulpit').insertOne({
              pulpit: data.pulpit,
              pulpit_name: data.pulpit_name,
              faculty: data.faculty
            });
          })
          .then(result => {
            sendResponse(res, 201, {
              _id: result.insertedId.toString(),
              pulpit: data.pulpit,
              pulpit_name: data.pulpit_name,
              faculty: data.faculty
            });
          });
      })
      .catch(err => {
        if (err.status) {
          sendError(res, err.status, err.message);
        } else if (err.message === 'Invalid JSON') {
          sendError(res, 400, 'Invalid JSON format');
        } else {
          console.error('POST /api/pulpits error:', err);
          sendError(res, 500, 'Internal server error');
        }
      });
  }

  else if (pathname === '/api/faculties' && method === 'PUT') {
    parseBody(req)
      .then(data => {
        const validationError = validateFaculty(data);
        if (validationError) {
          return Promise.reject({ status: 400, message: validationError });
        }

        return db.collection('faculty').findOne({ faculty: data.faculty })
          .then(existing => {
            if (!existing) {
              return Promise.reject({ status: 404, message: `Faculty with code '${data.faculty}' not found` });
            }
            return db.collection('faculty').updateOne(
              { faculty: data.faculty },
              { $set: { faculty_name: data.faculty_name } }
            );
          })
          .then(result => {
            sendResponse(res, 200, {
              faculty: data.faculty,
              faculty_name: data.faculty_name
            });
          });
      })
      .catch(err => {
        if (err.status) {
          sendError(res, err.status, err.message);
        } else if (err.message === 'Invalid JSON') {
          sendError(res, 400, 'Invalid JSON format');
        } else {
          console.error('PUT /api/faculties error:', err);
          sendError(res, 500, 'Internal server error');
        }
      });
  }

  else if (pathname === '/api/pulpits' && method === 'PUT') {
    parseBody(req)
      .then(data => {
        const validationError = validatePulpit(data);
        if (validationError) {
          return Promise.reject({ status: 400, message: validationError });
        }

        return db.collection('pulpit').findOne({ pulpit: data.pulpit })
          .then(existing => {
            if (!existing) {
              return Promise.reject({ status: 404, message: `Pulpit with code '${data.pulpit}' not found` });
            }
            return db.collection('faculty').findOne({ faculty: data.faculty });
          })
          .then(faculty => {
            if (!faculty) {
              return Promise.reject({ status: 400, message: `Faculty with code '${data.faculty}' does not exist` });
            }
            return db.collection('pulpit').updateOne(
              { pulpit: data.pulpit },
              { $set: { pulpit_name: data.pulpit_name, faculty: data.faculty } }
            );
          })
          .then(result => {
            sendResponse(res, 200, {
              pulpit: data.pulpit,
              pulpit_name: data.pulpit_name,
              faculty: data.faculty
            });
          });
      })
      .catch(err => {
        if (err.status) {
          sendError(res, err.status, err.message);
        } else if (err.message === 'Invalid JSON') {
          sendError(res, 400, 'Invalid JSON format');
        } else {
          console.error('PUT /api/pulpits error:', err);
          sendError(res, 500, 'Internal server error');
        }
      });
  }

  else if (pathname.startsWith('/api/faculties/') && method === 'DELETE') {
    const code = pathname.split('/')[3];
    
    if (!code) {
      return sendError(res, 400, 'Faculty code is required');
    }

    db.collection('pulpit').findOne({ faculty: code })
      .then(pulpit => {
        if (pulpit) {
          return Promise.reject({ status: 400, message: `Cannot delete faculty '${code}' because it is referenced by pulpit '${pulpit.pulpit}'` });
        }
        return db.collection('faculty').findOne({ faculty: code });
      })
      .then(faculty => {
        if (!faculty) {
          return Promise.reject({ status: 404, message: `Faculty with code '${code}' not found` });
        }
        return db.collection('faculty').deleteOne({ faculty: code });
      })
      .then(result => {
        sendResponse(res, 200, { 
          message: `Faculty '${code}' deleted successfully`,
          deletedCount: result.deletedCount
        });
      })
      .catch(err => {
        if (err.status) {
          sendError(res, err.status, err.message);
        } else {
          console.error('DELETE /api/faculties error:', err);
          sendError(res, 500, 'Internal server error');
        }
      });
  }

  else if (pathname.startsWith('/api/pulpits/') && method === 'DELETE') {
    const code = pathname.split('/')[3];
    
    if (!code) {
      return sendError(res, 400, 'Pulpit code is required');
    }

    db.collection('pulpit').findOne({ pulpit: code })
      .then(pulpit => {
        if (!pulpit) {
          return Promise.reject({ status: 404, message: `Pulpit with code '${code}' not found` });
        }
        return db.collection('pulpit').deleteOne({ pulpit: code });
      })
      .then(result => {
        sendResponse(res, 200, { 
          message: `Pulpit '${code}' deleted successfully`,
          deletedCount: result.deletedCount
        });
      })
      .catch(err => {
        if (err.status) {
          sendError(res, err.status, err.message);
        } else {
          console.error('DELETE /api/pulpits error:', err);
          sendError(res, 500, 'Internal server error');
        }
      });
  }

  else {
    sendError(res, 404, 'Resource not found');
  }
}

client.connect()
  .then(() => {
    console.log('Connected to MongoDB at', mongoURI);
    db = client.db('BSTU');
    
    return initializeDatabase();
  })
  .then(() => {
    server = http.createServer(requestHandler);
    
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('\nAvailable endpoints:');
      console.log('  GET    /api/faculties           - Get all faculties');
      console.log('  GET    /api/pulpits             - Get all pulpits');
      console.log('  POST   /api/faculties           - Add new faculty');
      console.log('  POST   /api/pulpits             - Add new pulpit');
      console.log('  PUT    /api/faculties           - Update faculty');
      console.log('  PUT    /api/pulpits             - Update pulpit');
      console.log('  DELETE /api/faculties/:code     - Delete faculty');
      console.log('  DELETE /api/pulpits/:code       - Delete pulpit');
      console.log('\nFaculty JSON format:');
      console.log('  { "faculty": "FIT", "faculty_name": "Faculty Name" }');
      console.log('\nPulpit JSON format:');
      console.log('  { "pulpit": "POIT", "pulpit_name": "Pulpit Name", "faculty": "FIT" }');
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

process.on('SIGINT', () => {
  
  const shutdownPromises = [];
  
  if (client) {
    shutdownPromises.push(client.close());
  }
  
  Promise.all(shutdownPromises)
    .then(() => {
      console.log('MongoDB connection closed');
      if (server) {
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    })
    .catch(err => {
      console.error('Error during shutdown:', err);
      process.exit(1);
    });
});
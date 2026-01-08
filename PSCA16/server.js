const { createServer } = require('http');
const { graphql, buildSchema } = require('graphql');
const fs = require('fs');
const resolvers = require('./resolvers');

const schemaPath = './schema.gql';
const schemaString = fs.readFileSync(schemaPath, 'utf-8');
const schema = buildSchema(schemaString);

const server = createServer(async (req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const { query, variables } = JSON.parse(body);
        const result = await graphql({
          schema,
          source: query,
          rootValue: resolvers,
          variableValues: variables,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errors: [{ message: error.message }] }));
      }
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
  }
});

server.listen(3000, () => {
  console.log('GraphQL сервер запущен на http://localhost:3000');
});
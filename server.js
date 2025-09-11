const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json'); // seu db.json
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(router);

// Render/Heroku/Railway vão colocar a porta na env PORT
const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`JSON Server rodando na porta ${port}`);
});


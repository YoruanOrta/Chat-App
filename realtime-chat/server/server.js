const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8989 });

const users = new Map();

console.log('WebSocket server started on port 8989');

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (data) => {
    const parsedData = JSON.parse(data);
    
    switch (parsedData.type) {
      case 'username':
        // Registrar el usuario
        users.set(ws, parsedData.payload.name);
        console.log(`User registered: ${parsedData.payload.name}`);
        
        // Enviar la lista actualizada de usuarios a todos
        broadcastUsers();
        break;
        
      case 'message':
        // Transmitir el mensaje a todos los clientes
        console.log(`Message from ${parsedData.payload.author}: ${parsedData.payload.message}`);
        broadcast({
          type: 'message',
          payload: {
            message: parsedData.payload.message,
            author: parsedData.payload.author
          }
        });
        break;
    }
  });

  ws.on('close', () => {
    const username = users.get(ws);
    console.log(`Client disconnected: ${username}`);
    users.delete(ws);
    broadcastUsers();
  });
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function broadcastUsers() {
  const userList = Array.from(users.values());
  broadcast({
    type: 'users',
    payload: userList
  });
}
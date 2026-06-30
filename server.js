// be/server.js
import dotenv from "dotenv";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appEnv =
 process.env.APP_ENV ||
 process.env.NODE_ENV ||
 "development";

dotenv.config({
 path: path.join(
  __dirname,
  `.env.${appEnv}`
 ),
});
dotenv.config({
 path: path.join(__dirname, ".env"),
 override: false,
});

const { default: app } =
 await import("./app.js");

const PORT = Number(
 process.env.PORT || 3000
);

const FRONTEND_URL =
 process.env.FRONTEND_URL ||
 "http://localhost:5173";

const JWT_SECRET =
 process.env.JWT_SECRET;

if (!JWT_SECRET) {
 throw new Error(
  "JWT_SECRET is required"
 );
}

const server =
 http.createServer(app);

const io = new Server(server, {
 cors: {
  origin: FRONTEND_URL,
  credentials: true,
 },
 transports: [
  "websocket",
  "polling",
 ],
});

app.set("io", io);

io.use((socket, next) => {
 try {
  console.log(
   "AUTH:",
   socket.handshake.auth
  );

  let token =
   socket.handshake.auth
    ?.token;

  if (!token || typeof token !== "string") {
   const cookieHeader = socket.handshake.headers.cookie;
   if (cookieHeader) {
    const match = cookieHeader.match(/access_token=([^;]+)/);
    if (match) {
     token = match[1];
    }
   }
  }

  if (!token) {
   console.log(
    "TOKEN EMPTY"
   );

   return next(
    new Error(
     "Unauthorized"
    )
   );
  }

  const decoded =
   jwt.verify(
    token,
    process.env.JWT_SECRET
   );

  console.log(
   "DECODED:",
   decoded
  );

  socket.user = decoded;

  next();
 } catch (error) {
  console.error(
   "SOCKET AUTH ERROR:",
   error.message
  );

  next(
   new Error(
    "Unauthorized"
   )
  );
 }
});

io.on(
 "connection",
 (socket) => {
  const userId =
   socket.user?.id;

  console.log(
   "Socket connected:",
   socket.id
  );

  if (userId) {
   socket.join(
    `user:${userId}`
   );
  }

  socket.on(
   "disconnect",
   (reason) => {
    console.log(
     "Socket disconnected:",
     reason
    );
   }
  );
 }
);

server.listen(
 PORT,
 "0.0.0.0",
 () => {
  console.log(
   `Server running on port ${PORT}`
  );
 }
);

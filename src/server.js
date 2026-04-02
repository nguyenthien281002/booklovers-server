// import express from "express";
// import bodyParser from "body-parser";
// import viewEngine from "./config/viewEngine";
// import initWebRoutes from "./route/web";
// import cors from "cors";
// require("dotenv").config();

// let app = express();

// app.use(cors());

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use("/uploads", express.static("public/uploads"));
// app.use("/avatar", express.static("public/avatar"));
// app.set("json spaces", 2);

// viewEngine(app);
// initWebRoutes(app);

// let port = process.env.PORT || 6969;

// app.listen(port, () => {
//   console.log("backend nodejs is runnung on the port: " + port);
// });

import express from "express";
import bodyParser from "body-parser";
import viewEngine from "./config/viewEngine";
import initWebRoutes from "./route/web";
import cors from "cors";
import http from "http";
import { initSocket } from "./socket/socketServer";
require("dotenv").config();

let app = express();

// ===== HTTP SERVER =====
let server = http.createServer(app);

// ===== SOCKET INIT =====
initSocket(server);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/uploads", express.static("public/uploads"));
app.use("/avatar", express.static("public/avatar"));
app.set("json spaces", 2);

viewEngine(app);
initWebRoutes(app);

let port = process.env.PORT || 6969;

server.listen(port, () => {
  console.log("backend nodejs is running on port: " + port);
});

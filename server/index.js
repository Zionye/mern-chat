const express = require("express");
const cors = require("cors"); // 用于提供 Connect/Express 中间件。https://www.npmjs.com/package/cors
const mongoose = require("mongoose"); // https://www.npmjs.com/package/mongoose
const cookieParser = require("cookie-parser"); // https://www.npmjs.com/package/cookie-parser
const dotenv = require("dotenv"); // Dotenv 是一个零依赖模块，它将环境变量从 .env 文件加载到 process.env 中。https://www.npmjs.com/package/dotenv
const jwt = require("jsonwebtoken"); // 用于在两方（通常是客户端和服务器）之间安全地创建和发送数据。 https://www.npmjs.com/package/jsonwebtoken
const bcrypt = require("bcryptjs"); // 密码哈希 https://www.npmjs.com/package/bcryptjs
const User = require("./models/User");
const Message = require("./models/Message");
const ws = require("ws"); // WebSocket。 https://www.npmjs.com/package/ws

dotenv.config(); // process.env 现在具有您在 .env 文件中定义的键和值
// https://mongoosejs.com/docs/connections.html
console.log("process.env.MONGO_URL: ", process.env.MONGO_URL);
mongoose
  .connect(process.env.MONGO_URL)
  .then((con) => {
    // console.log("con.connections:", con.connections);
    console.log("---> Connection successful <---");
  })
  .catch((error) => {
    if (error) throw error;
  });
// // 方式2：
// const intialDbConnection = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URL);
//     console.log("---> db connected successful <---");
//   } catch (err) {
//     console.log(err.stack || err);
//     console.log("---> mongodb connection failed <---");
//   }
// };
// intialDbConnection()
//   .then(() => console.log("connected"))
//   .catch((error) => {
//     if (error) throw error;
//   });

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

var whitelist = [process.env.CLIENT_URL]; //white list consumers
var corsOptions = {
  // origin: process.env.CLIENT_URL,
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  // methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
  // optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true, //Credentials are cookies, authorization headers or TLS client certificates.
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "device-remember-token",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials",
    "Origin",
    "Accept",
  ],
};

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
// app.use(
//   cors({
//     credentials: true,
//     origin: process.env.CLIENT_URL,
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "X-Requested-With",
//       "device-remember-token",
//       "Access-Control-Allow-Origin",
//       "Origin",
//       "Accept",
//     ],
//     // methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
//     // optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
//   })
// );

async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    console.log("getUserDataFromRequest token: --》", token);
    if (token) {
      // https://www.npmjs.com/package/jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        // res.json(userData);
        resolve(userData);
      });
    } else {
      reject("no token");
    }
  });
}

app.get("/test", (req, res) => {
  res.json("test ok~");
});

app.get("/message/:userId", async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.userId;
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});

app.get("/people", async (req, res) => {
  const user = await User.find({}, { _id: 1, username: 1 });
  res.json(user);
});

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  console.log("profile token: --》", token);
  if (token) {
    // https://www.npmjs.com/package/jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
    res.status(401).json("no token");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    console.log("login user->", user);
    if (user) {
      const passOk = bcrypt.compareSync(password, user.password);
      if (passOk) {
        jwt.sign(
          { userId: user._id, username },
          jwtSecret,
          {},
          (err, token) => {
            if (err) throw err;
            console.log("login token: -->", token);
            res
              .cookie("token", token, { sameSite: "none", secure: true })
              .json({
                id: user._id,
              });
          }
        );
      }
    }
  } catch (error) {
    if (error) throw error;
    res.status(500).json("error");
  }
});

app.post("/register", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createUser = await User.create({
      username,
      password: hashedPassword,
    });
    jwt.sign(
      { userId: createUser._id, username }, // 该内容会在后续（jwt.verify）时返回（userData）
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        console.log("register token: -->", token);
        // https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/201
        // res.cookie("token", token).status(201).json("OK");
        res
          .cookie("token", token, { sameSite: "none", secure: true })
          .status(201)
          .json({
            id: createUser._id,
          });
      }
    );
  } catch (error) {
    if (error) throw error;
    res.status(500).json("error");
  }
});

const server = app.listen(4040);

const wss = new ws.WebSocketServer({ server });
wss.on("connection", (connection, req) => {
  // read username and id from the cookies for this connection
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    console.log("tokenCookieString: ", tokenCookieString);

    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];

      if (token) {
        console.log("token: ", token);
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          console.log("userData: ", userData);
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }

  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    console.log("message: ", messageData);
    const { recipient, text } = messageData;
    if (recipient && text) {
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
      });

      [...wss.clients]
        .filter((c) => c.userId === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              sender: connection.userId,
              recipient,
              _id: messageDoc._id,
            })
          )
        );
    }
  });

  // notify  everyone about online people(when someone connects)
  [...wss.clients].map((client) => {
    client.send(
      JSON.stringify({
        online: [...wss.clients].map((c) => ({
          userId: c.userId,
          username: c.username,
        })),
      })
    );
  });
});

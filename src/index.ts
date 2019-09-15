import * as express from "express";
import * as http from "http";
import * as socket from "socket.io";
import * as bodyParser from "body-parser";
import * as multer from 'multer';
import * as errorhandler from 'errorhandler';
import * as cors from 'cors';
import axios from 'axios';
import * as moment from 'moment';
import * as fs from 'fs';
import * as useragent from 'express-useragent';

const app = express();
const server = new http.Server(app);
const io = socket(server);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, 'maxresdefault.jpg');
  },
});
let upload = multer({ storage: storage }).single('FormData');

const logger = fs.createWriteStream('logs.log', {
  flags: 'a',
});


io.on("connection", (socket) => {
  const dateNow: Date = new Date(Date.now());
  const UserAgent:any = socket.request.headers['user-agent'];
  logger.write(`[${moment(dateNow).format()}] ${socket.request.connection.remoteAddress} ${JSON.stringify(UserAgent.version)} ${JSON.stringify(UserAgent.source)} ${JSON.stringify(UserAgent.os)} ${JSON.stringify(UserAgent.platform)} - New connection \n`);
  console.log("An agent has connected to the socket!");
  socket.on('disconnect', () => {
    console.log('An agent has disconnected from the socket!')
  });
  socket.on('eventServer', function (data) {
    console.log(data);
    socket.emit('eventClient', { data: 'Hello Client' });
  });
});


app.use(cors({
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'X-Access-Token', 'Authorization'],
  credentials: true,
  methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
}));

app.use(errorhandler());


app.use(useragent.express());

app.get('/', function (req, res) {
  console.log('GET');
  res.sendStatus(200);
});

app.post('/json', bodyParser.json(), bodyParser.urlencoded({ extended: true }), async function (req, res) {
  let searchString = req.body.query.split(' ').join('+');
  let googleSearch = await axios.get(`https://www.google.com/search?q=${searchString}`);
  fs.writeFileSync('mysql.json', googleSearch.data);
  const dateNow: Date = new Date(Date.now());
  const UserAgent:any = req.useragent;
  console.log(`[${moment(dateNow).format()}] ${req.connection.remoteAddress} ${JSON.stringify(UserAgent.version)} ${JSON.stringify(UserAgent.source)} ${JSON.stringify(UserAgent.os)} ${JSON.stringify(UserAgent.platform)} - New JSON: ${JSON.stringify(req.body)}, About 144,000,000 results.`);
  logger.write(`[${moment(dateNow).format()}] ${req.connection.remoteAddress} ${JSON.stringify(UserAgent.version)} ${JSON.stringify(UserAgent.source)} ${JSON.stringify(UserAgent.os)} ${JSON.stringify(UserAgent.platform)} - New JSON: ${JSON.stringify(req.body)}, About 144,000,000 results. \n`);
  res.sendStatus(200).end();
});

app.post('/raw', bodyParser.raw({
  inflate: true,
  limit: '100kb',
  type: 'application/octet-stream'
}), function (req, res) {
  const dateNow: Date = new Date(Date.now());
  const UserAgent:any = req.useragent;
  console.log(`[${moment(dateNow).format()}] ${req.connection.remoteAddress} ${JSON.stringify(UserAgent.version)} ${JSON.stringify(UserAgent.source)} ${JSON.stringify(UserAgent.os)} ${JSON.stringify(UserAgent.platform)} - New RAW: ${req.body}`);
  logger.write(`[${moment(dateNow).format()}] ${req.connection.remoteAddress} ${JSON.stringify(UserAgent.version)} ${JSON.stringify(UserAgent.source)} ${JSON.stringify(UserAgent.os)} ${JSON.stringify(UserAgent.platform)} - New RAW: ${req.body} \n`);
  res.sendStatus(200).end();
});

app.post('/binary', bodyParser.json(), bodyParser.urlencoded({ extended: true }), function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      return res.sendStatus(err.status).end();
    }
    const dateNow: Date = new Date(Date.now());
    const UserAgent:any = req.useragent;
    console.log(`[${moment(dateNow).format()}] ${req.connection.remoteAddress} ${JSON.stringify(UserAgent.version)} ${JSON.stringify(UserAgent.source)} ${JSON.stringify(UserAgent.os)} ${JSON.stringify(UserAgent.platform)} - New Image: localhost:3000/uploads/maxresdefault.jpg (public link)`);
    logger.write(`[${moment(dateNow).format()}] ${req.connection.remoteAddress} ${JSON.stringify(UserAgent.version)} ${JSON.stringify(UserAgent.source)} ${JSON.stringify(UserAgent.os)} ${JSON.stringify(UserAgent.platform)} - New Image: localhost:3000/uploads/maxresdefault.jpg (public link) \n`);
    res.sendStatus(200).end();
  });
});
app.use('/uploads', express.static('uploads'));


server.listen(process.env.PORT || 3000, () => {
  console.log(`Application listening on port ${process.env.PORT || 3000}!`);
});

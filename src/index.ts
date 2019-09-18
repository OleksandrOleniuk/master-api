import * as express from 'express';
import * as http from 'http';
import * as socket from 'socket.io';
import * as bodyParser from 'body-parser';
import * as multer from 'multer';
import * as errorhandler from 'errorhandler';
import * as cors from 'cors';
import * as moment from 'moment';
import * as useragent from 'express-useragent';
import { Server } from 'socket.io';
import { Utils } from './Utils';

const app = express();
const server = new http.Server(app);
let io: Server = socket(server);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, 'maxresdefault.jpg');
  },
});
let upload = multer({ storage: storage }).single('FormData');

io.on("connection", onConnection);

function onConnection(socket: any) {
  const dateNow: Date = new Date(Date.now());
  const UserAgent: any = socket.request.headers['user-agent'];
  const address = socket.handshake.address;
  console.log(address);
  const log = `[${moment(dateNow).format()}] ${address} ${UserAgent} - New connection`;
  Utils.sendLogs(log);
  socket.on('disconnect', () => {
    console.log('An agent has disconnected from the socket!')
  });
  socket.on('eventServer', function (data: any) {
    console.log(data);
    socket.emit('eventClient', { data: 'Hello Client' });
  });
  setTimeout(() => {
    socket.disconnect(false);
  }, Utils.randomNumber(5000, 100000));

}

app.use(cors({
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'X-Access-Token', 'Authorization'],
  credentials: true,
  methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
}));

app.use(errorhandler());


app.use(useragent.express());

app.post('/json', bodyParser.json(), bodyParser.urlencoded({ extended: true }), async function (req, res) {
  try {
    const dateNow: Date = new Date(Date.now());
    const UserAgent: any = req.useragent;
    let googleSearch = await Utils.googleIt({ query: req.body.query });
    const log = `[${moment(dateNow).format()}] ${req.connection.remoteAddress} ${JSON.stringify(UserAgent.version)} ${JSON.stringify(UserAgent.source)} ${JSON.stringify(UserAgent.os)} ${JSON.stringify(UserAgent.platform)} - New JSON: ${JSON.stringify(req.body)}, About ${googleSearch} results.`;
    Utils.sendLogs(log);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(400);
  }
});

app.post('/raw', bodyParser.raw({
  inflate: true,
  limit: '100kb',
  type: 'application/octet-stream'
}), function (req, res) {
  const dateNow: Date = new Date(Date.now());
  const UserAgent: any = req.useragent;
  const log = `[${moment(dateNow).format()}] ${req.connection.remoteAddress} ${JSON.stringify(UserAgent.version)} ${JSON.stringify(UserAgent.source)} ${JSON.stringify(UserAgent.os)} ${JSON.stringify(UserAgent.platform)} - New RAW: ${req.body}`;
  Utils.sendLogs(log);
  res.sendStatus(200);
});

app.post('/binary', bodyParser.json(), bodyParser.urlencoded({ extended: true }), function (req, res) {
  try {
    upload(req, res, function (err) {
      if (err) {
        return res.sendStatus(err.status).end();
      }
      const dateNow: Date = new Date(Date.now());
      const UserAgent: any = req.useragent;
      const log = `[${moment(dateNow).format()}] ${req.connection.remoteAddress} ${JSON.stringify(UserAgent.version)} ${JSON.stringify(UserAgent.source)} ${JSON.stringify(UserAgent.os)} ${JSON.stringify(UserAgent.platform)} - New Image: localhost:3000/uploads/maxresdefault.jpg (public link)`;
      Utils.sendLogs(log);
      res.sendStatus(200);
    });
  }
  catch (e) {
    res.sendStatus(400);
  }

});
app.use('/uploads', express.static('uploads'));


server.listen(process.env.PORT || 3000, () => {
  console.log(`Application listening on port ${process.env.PORT || 3000}!`);
});

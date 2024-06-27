const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.configDotenv({ path: './.env' });

require('./database');

const homeRouter = require('./routes/home.routes');
const userRouter = require('./routes/user.routes');
const fileRouter = require('./routes/file.routes');
const folderRouter = require('./routes/folder.routes');

const app = express();

app.use(cors());
// app.use(dotenv())
app.use('/assets', express.static('assets'));
app.set("port", 4000);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SET the HOME path
app.use('/api', homeRouter);

// SET the USER path
app.use('/api/users', userRouter);

// SET the FILES path
app.use('/api/files', fileRouter);

// SET the FOLDERS path
app.use('/api/folders', folderRouter);





app.listen(app.get("port"));
console.log(`Listening on PORT: ${app.get("port")}`);
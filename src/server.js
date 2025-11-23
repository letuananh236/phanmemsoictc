const path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const appConfig = require('./config/app.config');
require('./config/db.config');
const { errorHandler } = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const mainRoutes = require('./routes/main.routes');
const examRoutes = require('./routes/exam.routes');
const cameraRoutes = require('./routes/camera.routes');
const examSearchRoutes = require('./routes/examSearch.routes');
const doctorRoutes = require('./routes/doctor.routes');
const printRoutes = require('./routes/print.routes');
const configRoutes = require('./routes/config.routes');
const licenseRoutes = require('./routes/license.routes');
const backupRoutes = require('./routes/backup.routes');
const aboutRoutes = require('./routes/about.routes');

const app = express();
app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views'), path.join(__dirname, 'views-print')]);
app.set('layout', 'layouts/main');
app.use(expressLayouts);
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: appConfig.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use((req, res, next) => {
  res.locals.title = 'Phần mềm soi cổ tử cung';
  next();
});

app.use(authRoutes);
app.use(mainRoutes);
app.use(examRoutes);
app.use(cameraRoutes);
app.use(examSearchRoutes);
app.use(doctorRoutes);
app.use(printRoutes);
app.use(configRoutes);
app.use(licenseRoutes);
app.use(backupRoutes);
app.use(aboutRoutes);

app.get('/', (req, res) => res.redirect('/login'));

app.use(errorHandler);

app.listen(appConfig.PORT, () => {
  console.log(`Server running at http://localhost:${appConfig.PORT}`);
});

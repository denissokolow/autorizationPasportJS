const [{ Server: h1 }, x] = [require('http'), require('express')];
const bodyParser = require('body-parser');
const session = require('express-session');
const { u: User } = require('./models/user');
const bcrypt = require('bcrypt');
const passport = require('passport');
const passportLocal = require('passport-local');

const Router = x.Router();
const PORT = 4328;
const { log } = console;
const hu = { 'Content-Type': 'text/html; charset=utf-8' };
const app = x();

const ensureAuth = (r, res, done) => {
  if (!r.isAuthenticated()) return res.redirect('/login');
  return done();
};

passport.use(new passportLocal.Strategy({
  usernameField: 'login',
  passwordField: 'pass',
},
  async (login, password, done) => {
    let user;
    try {
      user = await User.findOne({ login });
      CrPassword = bcrypt.hashSync(password, user.salt);      
    } catch (e) {
      return done('!! ' + e);
    }

    if (!user || user.password !== CrPassword) {
      return done(null, false); // оба случая не найден юзер и неверен пароль
    }

    return done(null, user);
  }
));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((_id, done) => User.findById(_id, (err, user) => done(err, user)));


Router
  .route('/')
  .get(r => r.res.redirect('/login'));
Router
  .route('/err')
  .get(r => r.res.end('Увы, не получилось! Ещё раз: <a href="/profile">Профиль</a>'));
app
  .use((r, rs, n) => rs.status(200).set(hu) && n())
  .use(x.static('.'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(session({ secret: 'mysecret', resave: true, saveUninitialized: true }))
  .use(passport.initialize())
  .use(passport.session())
  .use('/', Router)

  .get('/login', r => r.res.render('login'))
  .post('/login/check', passport.authenticate('local', { successRedirect: '/profile', failureRedirect: '/err' }))

  .get('/profile', ensureAuth, r => r.res.send(`<a href="/logout">Хотите выйти, ${r.user.login}?</a>`)) 
  .get('/users', ensureAuth, async r => {
    const items = await User.find({});
    r.res.render('list', { title: 'TOP SECRET', items })
   }) 
  
  .post('/reg', async r => { 
    const { body: { login } } = r;
    const { body: { pass } } = r;
    const user = await User.findOne({ login });
    if(user){
      r.res.send('Имя пользователя уже занято')
    }else{
      const salt = bcrypt.genSaltSync(10);
      const passCript = bcrypt.hashSync(pass, salt)
      const crUs = await User.create({ login: login, password: passCript, salt: salt });
      r.res.send('Регистрация прошла успешно')
    } 
  })

  .get('/logout', (r,rs) => {
        r.session.destroy( e => {
          if (e) console.log(e);
        });
    rs.send('Вы вышли из профиля')
      })

  .use(({ res: r }) => r.status(404).set(hu).send('Пока нет!'))
  .use((e, r, rs, n) => rs.status(500).set(hu).send(`Ошибка: ${e}`))
  .set('view engine', 'pug') 
  .set('x-powered-by', false)
module.exports = h1(app)
  .listen(process.env.PORT || PORT, () => log(process.pid));

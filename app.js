require('dotenv').config();
require('ejs');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser')
const _ = require('lodash');
const MongoStore = require('connect-mongo')(session);

mongoose.connect(process.env.ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true);

const userSchema = mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    zipCode: {
        type: Number,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    }
});
const User = mongoose.model('user', userSchema);

const postSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    zipCode: {
        type: Number,
        required: true
    },
    postLink: {
        type: String,
        required: true
    },
    imageSrc: String
});
const Post = mongoose.model('post', postSchema);

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser())
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));


app.get('/', function (req, res) {
    res.render('welcome');
});

app.get('/register', function (req, res) {
    res.render('register');
});

app.get('/login', function (req, res) {
    res.render('login')
});

app.get('/_info', function (req, res) {
    res.send(req.session.email + '\n' + req.session.zipCode + '\n' + req.session.username);
})

app.get('/logout', function (req, res) {
    req.session.email = null;
    req.session.zipCode = null;
    res.redirect('/');
});

app.get('/post', function (req, res) {
    if (req.session.email && req.session.zipCode) {
        res.render('create');
    } else {
        res.redirect('/');
    }
});

app.get('/users/:user', function (req, res) {
    User.findOne({
        username: req.params.user,
        zipCode: req.session.zipCode
    }, function (findUserErr, user) {
        if (!findUserErr && user) {
            Post.find({
                author: user.username
            }, function (findPostsErr, posts) {
                if (!findPostsErr) {
                    res.render('user', {
                        user: user,
                        posts: posts
                    });
                } else {
                    res.render("error", {
                        title: 'Oops :(',
                        description: '(Internal error: ' + findPostsErr + ')',
                        href: '/home'
                    });
                }
            });
        } else {
            res.render("error", {
                title: 'User Not Found.',
                description: `This user is not available.`,
                href: '/home'
            });
        }
    });
});

app.get('/:user/:post', function (req, res) {
    Post.findOne({
        author: req.params.user,
        postLink: req.params.post,
        zipCode: req.session.zipCode
    }, function (err, post) {
        res.render('post', {
            post: post,
            zipCode: req.session.zipCode
        });
    });
});

app.get('/home', function (req, res) {
    if (req.session.email && req.session.zipCode) {
        Post.find({
            zipCode: req.session.zipCode
        }, function (err, posts) {
            if (!err) {
                res.render('feed', {
                    posts: posts
                });
            } else {
                res.render("error", {
                    title: 'Oops :(',
                    description: '(Internal error: ' + err + ')',
                    href: '/post'
                });
            }
        });
    } else {
        res.redirect('/');
    }
});

app.post('/register', function (req, res) {
    bcrypt.hash(req.body.password, 10, function (hashErr, hash) {
        if (!hashErr) {
            User.create({
                email: req.body.email,
                username: req.body.username,
                zipCode: req.body.zipCode,
                password: hash
            }, function (createErr) {
                if (!createErr) {
                    req.session.email = req.body.email;
                    req.session.zipCode = req.body.zipCode;
                    req.session.username = req.body.username;
                    res.redirect('/home');
                } else {
                    res.render("error", {
                        title: 'Oops :(',
                        description: '(Internal error: ' + createErr + ')',
                        href: '/register'
                    });
                }
            });
        } else {
            res.render("error", {
                title: 'Oops :(',
                description: '(Internal error: ' + hashErr + ')',
                href: '/register'
            });
        }
    });
});

app.post('/login', function (req, res) {
    User.findOne({
        email: req.body.email
    }, function (findErr, doc) {
        if (!findErr) {
            if (doc) {
                bcrypt.compare(req.body.password, doc.password, function (compareErr, same) {
                    if (!compareErr) {
                        if (same) {
                            req.session.email = doc.email;
                            req.session.zipCode = doc.zipCode;
                            req.session.username = doc.username;
                            res.redirect('/home');
                        } else {
                            res.render("error", {
                                title: 'Incorrect email/password combo',
                                description: `Your email and/or password is incorrect`,
                                href: '/login'
                            });
                        }
                    } else {
                        res.render("error", {
                            title: 'Oops :(',
                            description: '(Internal error: ' + compareErr + ')',
                            href: '/login'
                        });
                    }
                });
            } else {
                res.render("error", {
                    title: 'Invalid email',
                    description: `This email does not exist`,
                    href: '/login'
                });
            }
        } else {
            res.render("error", {
                title: 'Oops :(',
                description: '(Internal error: ' + findErr + ')',
                href: '/login'
            });
        }
    });
});

app.post('/post', function (req, res) {
    let title = req.body.title;
    let body = req.body.body;
    let image = req.body.image;
    if (title && body && req.session.email && req.session.zipCode) {
        Post.create({
            title: title,
            body: body,
            author: req.session.username,
            zipCode: req.session.zipCode,
            postLink: _.kebabCase(title),
            imageSrc: image
        }, function (createErr) {
            if (!createErr) {
                res.redirect('/home')
            } else {
                res.render("error", {
                    title: 'Oops :(',
                    description: '(Internal error: ' + createErr + ')',
                    href: '/post'
                });
            }
        });
    }
});

app.use(function (req, res) {
    res.status(404).render("error", {
        title: '404',
        description: 'The page you are trying to see is not avaliable',
        href: '/'
    });
});

app.listen(process.env.PORT || 7000);
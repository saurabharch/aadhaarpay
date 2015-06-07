var express = require('express');
var path = require('path');
var otpAuth = require('./otpAuth.js')
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var authError = {
  "302" : {
    "cause" : "Biometric data did not match" ,
    "msg" : "Please give your finger prints again."
  },
  "400" : {
    "cause" :   "OTP validation failed",
    "msg" :   "Please provide correct OTP value."
  },
  "997" : {
    "cause" :   "Invalid Aadhaar Status",
    "msg" :   "Your Aadhaar number status is not active. Kindly contact UIDAI Helpline."
  },
  "998" : {
    "cause" :   "Invalid Aadhaar Number",
    "msg" :   "Please enter a valid Aadhaar Number"
  },
  "570" :{
    "cause" : "OTP expired",
    "msg" : "Please send the request again to generate OTP again" 
  },
  "500" :{
    "cause" :   "Invalid Aadhaar Number",
    "msg" :   "Please enter a valid Aadhaar Number"
  }

}
var uuid = require('node-uuid');
var db = require('./db.js'); 
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: 'alymsdkas2sdaasdasda',
    name: 'badalalala',
    proxy: true,
    resave: true,
    saveUninitialized: true}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/',function(req,res,next){
    res.render('index');
});

app.get('/login',function(req,res,next){
    res.render('login');

});

app.get('/dashboard',function(req,res,next){
    var info = [];
    var infoString = '';
    if(req.session.name === undefined && req.session.uid === undefined){
      res.redirect('/');
    }

    db.get('$'+req.session.uid,function(err,value){
      if(!err){
        amt = value;        
        db.createReadStream()
          .on('data', function (data) {
            if(String(data.key).indexOf('b2c~'+String(req.session.uid)) !== -1 || String(data.key).indexOf('c2c~'+String(req.session.uid)) !== -1){
                 infoString += "<li><span class='span1'><strong>Recieved money</strong><br>from "+JSON.parse(data.value).details+" </span><span class='span2'>INR "+JSON.parse(data.value).amount+"</span></li>" ;
            }
          })
          .on('close', function () {
            console.log('Stream closed');


            



            res.render('dashboard',{'name':req.session.name,'amount':amt,'infoData':infoString});
          })



      }
    });


});







app.post('/auth',function(req,res){
  var otp = req.body.otp || '';
  var uid = req.body.uid;


  otpAuth(uid,otp,function (response){
    if(response.err)
      res.json({'err':true,'msg':'Server is not responding to requests'});
    else if(response.status){
      res.json({'err':false,'msg':'auth success'}); 
    }else{
      res.json({'err':true,'status':response.status,'cause':authError[response.statusCode].cause,'msg':authError[response.statusCode].msg});
    }


  })
    });

app.post('/completeProfile',function(req,res,next){
  var uid = req.cookies.uid || req.body.uid; 
  var username = req.body.username;

db.get('uid~'+uid,function(err,response){
  if(err){
    db.get('@'+username,function(err,response){
        if(err){
          addUser();
        }else
          res.json({'err':true,msg:'username already exists'})
    });
  }else{
        res.json({'err':true,msg:'Already Registered!! Please Login to continue'})
  }
});

  function addUser(){
  db.batch()
    .put('uid~'+uid,JSON.stringify(req.body))
    .put('@'+username,uid)
    .put('$'+uid,'5000')
    .write(function(err){
        if(err)
          res.json({'err':true,msg:'unable to add user to database'})
        else
          res.json({'err':false,msg:'successfully added to database'});
    });
  }  
});

app.post('/send/c2c',function(req,res){
  var amt = req.body.amount;
  var uid = req.session.uid ;
  var rec; 
  var sendersAmt;
  var recieverAmt;

  if(!!req.body.recieverUid){
    rec = req.body.recieverUid;
    getAmounts();
  }else{
    db.get('@'+req.body.recieverName,function(err,value){
      if(!err){
        rec = value;
        getAmounts();
      }else{
          res.json({'err':true,'msg':'No user exist with this username'});    
      }
    })
  }

function getAmounts(){

  db.get('$'+uid,function(err,value){
    if(!err){
      sendersAmt = parseFloat(value);
      db.get('$'+rec,function(err,value){
        if(!err){
          recieverAmt = parseFloat(value);
          validTransaction();
        }
      });  
    }
  });
}  

  
function validTransaction(){
  console.log(sendersAmt+'  '+recieverAmt+''+ amt );
  if(parseFloat(amt)<sendersAmt){
   sendersAmt -= parseFloat(amt);
   recieverAmt += parseFloat(amt);
   updateC2C();
  }else{
    res.json({'err':true,'msg':'you do not have sufficient balance'});
  }
 } 

function updateC2C(){
  db.batch()
    .put('c2c~'+rec+'~'+uuid.v1(),JSON.stringify(req.body))
    .put('$'+uid,sendersAmt)
    .put('$'+rec,recieverAmt)
    .write(function(err){
        if(err)
          res.json({'err':true,msg:'unable to send money'})
        else
          res.json({'err':false,msg:'successfully sent money'});
    });
}

});

//business/banks to consumer transfers
//These are mocked for this demo and would be replaced with a real api 

app.post('/get/b2c',function(req,res,next){
  var amt = req.body.amount;
  var uid = req.session.uid; 
  var recieverAmt;

  db.get('$'+uid,function(err,value){
    if(!err){
      recieverAmt = parseFloat(value);
      recieverAmt += parseFloat(amt); 
      updateB2C();
      }  
    });
  

function updateB2C(){
  db.batch()
    .put('b2c~'+uid+'~'+uuid.v1(),JSON.stringify(req.body))
    .put('$'+uid,recieverAmt)
    .write(function(err){
        if(err)
          res.json({'err':true,msg:'unable to recieve money'})
        else
          res.json({'err':false,msg:'successfully recieved money'});
    });
}
});


app.post('/send/c2b',function(req,res,next){
  var amt = req.body.amount;
  var uid = req.cookies.uid || req.body.uid; 
  var senderAmt;

  db.get('$'+uid,function(err,value){
    if(!err){
      senderAmt = parseFloat(value);
      senderAmt -= parseFloat(amt); 
      updateC2B();
    }  
  });
  

function updateB2C(){
  db.batch()
    .put('c2b~'+uid+'~'+uuid.v1(),JSON.stringify(req.body))
    .put('$'+uid,senderAmt)
    .write(function(err){
        if(err)
          res.json({'err':true,msg:'unable to send money'})
        else
          res.json({'err':false,msg:'successfully sent money'});
    });
}
});

app.post('/request',function(req,res,next){
    var uid = req.cookies.uid || req.body.uid;
    var rec; 

    if(!!req.body.recieverUid){
      rec = req.body.recieverUid;
      sendRequest();
    }else{
      db.get('@'+req.body.recieverName,function(err,value){
        if(!err){
          rec = value;
          sendRequest();
        }
      })
    }

  function sendRequest(){
    db.batch()
      .put('req~'+rec+'~'+uuid.v1(),JSON.stringify(req.body))
      .write(function(err){
          if(err)
            res.json({'err':true,msg:'request failed'})
          else
            res.json({'err':false,msg:'request sent successfully'});
      });
  }

});

app.post('/login',function(req,res,next){
  var uid; 

  if(!!req.body.uid){
    uid = req.body.uid;
    signin();
  }else{
    db.get('@'+req.body.username,function(err,value){
      if(!err){
        uid = value;
        signin();
      }
    })
  }



  function signin(){
    db.get('uid~'+uid,function(err,value){
      if(err)
        res.json({'err':true,'msg':'invalid username or password'});
      else if(req.body.password === JSON.parse(value).password){
        session = req.session;
        session.uid = uid; 
        session.name = JSON.parse(value).name; 
        res.json({'err':false,'msg':'Successfull login'});
      }else{
        res.json({'err':true,'msg':'invalid username or password'});
      }     
    });
  }

});













// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
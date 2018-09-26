var express = require('express');
var bodyParser = require('body-parser')
var app = express()

var tcpleveldb = require('tcpleveldb')

var fs = require('fs')
var ini = require('ini')

app.use(express.static('public'));
app.use('/vue',express.static(__dirname + '/node_modules/vue'));
app.use('/vue-resource',express.static(__dirname + '/node_modules/vue-resource'));
app.use('/bulma', express.static(__dirname + '/node_modules/bulma/css'));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var config = ini.parse(fs.readFileSync('./database.ini', 'utf-8'))
var clients = {}

for(let i in config){
    clients[config[i].db] = new tcpleveldb.Client(config[i].port,config[i].host,config[i].username,config[i].password)
    clients[config[i].db].on('error', function(err){console.log(err)})
    clients[config[i].db].on('close', function(status){console.log(status)})
}

app.get('/', function (req, res) {
   res.sendFile( __dirname + "/view/" + "index.html" );
})


//get all databases from ini-file
app.get('/api/database', function (req, res) {
    config = ini.parse(fs.readFileSync('./database.ini', 'utf-8'))
    res.json(JSON.stringify(config));
})

//get all databases from ini-file
app.post('/api/deleteini', function (req, res) {
  for(let conf in config){
    if(config[conf].db === req.body.db){
      delete config[conf]
    }
  }
  fs.writeFile('./database.ini', ini.encode(config), 'utf-8', function(err){
    if(err)
    res.json(JSON.stringify({err : err, data : config}));
    else
    res.end(null);
})
})


//update the ini-file
app.post('/api/database', function (req, res) {
    config[Object.keys(config).length] = req.body
    if(clients[req.body.db] instanceof tcpleveldb.Client){
        delete clients[req.body.db]
    }
    clients[req.body.db] = new tcpleveldb.Client(req.body.port, req.body.host, req.body.username, req.body.password)
    clients[req.body.db].on('error', function(err){console.log(err)})
    clients[req.body.db].on('close', function(status){console.log(status)})
    fs.writeFile('./database.ini', ini.encode(config), 'utf-8', function(err){
        if(err)
        res.json(JSON.stringify({err : err, data : config}));
        else
        res.end(null);
    })
})

//query the database
app.post('/api/tcpleveldb', function (req, res) {
   handler(clients[req.body.db], req.body, function(err, data){
        res.json(JSON.stringify({err : err, data : data}));
   })  
})

// server listen
var server = app.listen(process.env[2] || 8081, process.env[3] || 'localhost', function () {
   var host = server.address().address
   var port = server.address().port
   console.log("tcpleveldb-panel listening at http://%s:%s", host, port)
})


/**
 * {
 *  meta : get, put, stream, batch, filter, count, del, update
 *  db: path of the db like ./db
 *  key: 
 *  value
 * }
 * @param {tcpleveldb client} db 
 * @param {data} data 
 * @param {callback} cb 
 */
function handler(db, data, cb){

    switch(data.meta){
    case 'get':
    db.get(data.db, data.key, function(err, doc){
      if(err) throw err
      cb(err, doc)
    })
    break
    case 'put':
    try{
      data.value = JSON.parse(data.value)
    }
    catch(e){

    }
    db.put(data.db, {key : data.key, value : data.value}, function(err, key){
      if(err) throw err
      cb(err, key)
    })
    break
    case 'del':
    db.del(data.db, data.key, function(err, key){
      if(err) throw err
      cb(err, key)
    })
    break
    case 'update':
    try{
      data.value = JSON.parse(data.value)
    }
    catch(e){

    }
    db.update(data.db, {key : data.key, value : data.value}, function(err, docs){
      if(err) throw err
      cb(err,docs)
    })
    break
    case 'stream':
    try{
      data.value = JSON.parse(data.value)
    }
    catch(e){

    }
    db.stream(data.db, data.value, function(err, docs){
      if(err) throw err
      cb(err, docs)
    })
    break
    case 'batch':
    try{
      data.value = JSON.parse(data.value)
    }
    catch(e){

    }
    db.batch(data.db, data.value, function(err, docs){
      if(err) throw err
      cb(err, docs)
    })
    break
    case 'filter':
    try{
      data.value = JSON.parse(data.value)
    }
    catch(e){

    }
    db.filter(data.db, data.value, function(err, docs){
      if(err) throw err
      cb(err, docs)
    })
    break
    case 'count':
    db.count(data.db, data.value, function(err, numb){
      if(err) throw err
      cb(err, numb)
    })
    break
    default:
    break
  }
}




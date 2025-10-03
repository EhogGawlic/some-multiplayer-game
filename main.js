const express = require('express')
const app = express()
const port = 3000

const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const bcrypt = require('bcrypt')
dotenv.config()
const cookieParser = require('cookie-parser')
const fs = require('fs')
const {MongoClient} = require('mongodb')
const client = new MongoClient(process.env.URI)
app.use(cookieParser())
//stuff
async function getAllData(collection){
    const db = client.db('wchat')
    const coll = db.collection(collection)
    const data = await coll.find({}).toArray()
    return data
}
async function addData(collection, data){
    const db = client.db('wchat')
    
    const coll = db.collection(collection)
    const result = await coll.insertOne(data)
    return result
}
async function getOneData(collection, query){
    const db = client.db('wchat')
    const coll = db.collection(collection)
    const data = await coll.find(query).next()
    return data
}
async function deleteData(collection, query){
    const db = client.db('wchat')
    const coll = db.collection(collection)
    const result = await coll.deleteOne(query)
    
}
async function updateData(collection, query, data){
	const db = client.db('wchat')
	const coll = db.collection(collection)
	const result = coll.updateOne(query, {$set: data})
}
async function encryptPassword(password){
    const saltRounds = 10;
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(password, saltRounds);
    return hash
}
async function comparePassword(password, hash){
    const bcrypt = require('bcrypt');
    const result = await bcrypt.compare(password, hash);
    return result
}
async function generateAccessToken(username){
    return jwt.sign({username}, process.env.SECRET, {expiresIn: '1800s'})
}
async function verifyToken(token){
    try{
        const decoded = jwt.verify(token, process.env.SECRET)

        return decoded
    } catch (e) {
        return null
    }
}

async function initMongo(){
	try{
		await client.connect()
		console.log("Connected to MongoDB")
	} catch (e) {
		console.error(e)
	}
}
async function testSignin(req){
    
    if(!req.cookies.token){
        return "Not signed in"
    }
    const user = await verifyToken(req.cookies.token)
    if(!user){
        return "Expired token"
    }
    return user
}
initMongo().catch(console.error)
const db = client.db('game')
app.get('/play', async (req,res)=>{
    /*const usr = await testSignin(req)
    if (typeof(usr) == String){
        res.send(usr)
        return
    }
    const user = await getOneData('users',{username:usr.username})
    if (!user){
        res.send("what?")
        return
    }*/
res.render('play.ejs',{})
})
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'ejs')
app.set('views', __dirname)
app.use(express.static(__dirname+'public'));

const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    // Emit a test event to the client

    socket.emit('serverMessage', { message: 'Welcome to the game!' });
socket.on('clientMessage', (data) => {
    if (data.type=='upd'){
        socket.broadcast.emit('serverMessage', data);
    }
    if (data.type=='hit'){
        socket.broadcast.emit('serverMessage', {type:'hit',player:data.player});
    }
})
});
io.on('clientMessage', (data) => {
    console.log('Message from client:', data);
})
server.listen(port, () => {
    console.log(`App listening on port ${port}`);
})
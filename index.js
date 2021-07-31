const diskinfo = require('diskinfo')
const serveStatic = require('serve-static')
const AdmZip = require('adm-zip')
const fs = require('fs')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const express = require('express')
const path = require('path')
const app = express()

const multer  = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})
const upload = multer({ storage: storage })


var auth = false
const url = `mongodb+srv://glebClusterUser:glebClusterUserPassword@cluster0.fvfru.mongodb.net/files?retryWrites=true&w=majority`;

var options = {
    root: path.join(__dirname, 'views'),
}

const connectionParams={
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true 
}

mongoose.connect(url,connectionParams)
    .then( () => {
        console.log('Connected to database ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. \n${err}`);
    })

const FileSchema = new mongoose.Schema({
    owner: String,
    name: String,
    type: {
        type: String,
        enum: [ 'group', 'mp4', 'img', 'mp3' ],
        default: "group"
    },
    size: Number,
    content: [mongoose.Schema.Types.Map],
    linked: {
        type: String,
        default: "false"
    },
    link: {
        type: String,
        default: ""
    },
    path: {
        type: String,
        default: "root"
    }
});

const FileModel = mongoose.model('FileSchema', FileSchema);

const UsersSchema = new mongoose.Schema({
    email: String,
    password: String,
    name: String,
    age: Number,
},
{ collection : 'myusers' });
const UsersModel = mongoose.model('UsersModel', UsersSchema, 'myusers');

app.use('/', serveStatic(path.join(__dirname, '/dist')))

app.get('/home', (req, res)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    
    //получение всех файлов
    let queryOfFiles = FileModel.find({ owner: req.query.useremail })
    queryOfFiles.exec((err, allFiles) => {
        if (err){
            return
        }
        // return res.render('index', { allFiles: allFiles, auth: true, useremail: 'gleb@mail.ru' })
        return res.json({ allFiles: allFiles, auth: "true", useremail: req.query.useremail })
    })
    
})

app.post('/files/upload', upload.array('myFiles', 999), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    const files = req.files

    if(!files){
        console.log("Error to upload file ")
    }
    console.log("req.files: ", req.files)
    for(let file of req.files){
        let fileType = "img"
        if(file.mimetype.includes("img")){
            fileType = "img"
        } else if(file.mimetype.includes("mp4")){
            fileType = "mp4"
        } else if(file.mimetype.includes("audio")){
            fileType = "mp3"
        }
        fs.rename(`./uploads/${file.filename}`, `./uploads/${req.query.owner.split('@')[0]}/${file.filename}`, (err, file) => {
            if(err) {
                return res.json({ "status": "error" })
            }
        })
        await new FileModel({ name: file.filename, size: file.size, type: fileType, path: req.query.filepath, owner: req.query.owner }).save(function (err) {
            if(err){
                return res.json({ "status": "error" })
            }
        })
    }
    let freespace = 0
    diskinfo.getDrives((err, aDrives) => {
        freespace = aDrives[0].available
    })
    return res.redirect(`https://upcload.herokuapp.com/?useremail=${req.query.owner}&path=${req.query.filepath}&freespace=${freespace}`)
})

app.get('/cleandata', (req, res) => {
    fs.unlink(`uploads/${req.query.useremail.split('@')[0]}/${req.query.filename}.zip`, (err) => {
        if(err) {
            return res.json({ 'status': 'error' })
        }
    })  
})

app.get('/files/delete', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    let fileids = req.query.fileids.split(',')
    let countOfFiles = fileids.length
    console.log('fileids: ', fileids)
        for(let fileIndex = 0; fileIndex < countOfFiles; fileIndex++){
            let queryOfFile = FileModel.findOne({"_id": fileids[fileIndex] })
            queryOfFile.exec((err, file) => {
                if(!file.type.includes('group')){
                    console.log("file: ", file)
                    if(err){
                        return res.json({ 'status': 'error' })
                    }
                    fs.unlink(`uploads/${req.query.owner.split('@')[0]}/${file.name}`, (err) => {
                        if(err) {
                            return res.json({ 'status': 'error' })
                        }
                    })  
                }
            })
        }
        let query = FileModel.find({ })
        query.exec((err, allFiles) => {
            let queryOfDelete = FileModel.deleteMany({ "_id": { $in: fileids } })
            queryOfDelete.exec((err, data) => {
                return res.json({ allFiles: allFiles })
            })
    })
})

app.get('/files/createfolder', (req,res)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    new FileModel({ name: req.query.filename, size: 0, type: "group", path: req.query.filepath, owner: req.query.owner }).save(function (err) {
        if(err){
            return res.json({ "status": "error" })
        }
        return res.json({ "status": "OK" })
    })
})

app.get('/users/check', (req,res)=>{
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    
    let query =  UsersModel.findOne({ 'email': req.query.useremail })
    query.exec((err, user) => {
        if (err || user === null || user === undefined){
            return res.json({ 'status': "Error" })
        } else {
            let loginCheck = req.query.useremail === user.email
            let passwordCheck = bcrypt.compareSync(req.query.userpassword, user.password) && req.query.userpassword !== ''
            if(user !== null && user !== undefined && loginCheck && passwordCheck){
                let freespace = 0
                diskinfo.getDrives((err, aDrives) => {
                    freespace = aDrives[0].available
                })
                return res.json({ 'status': "OK" , "freespace": freespace })
            } else {
                return res.json({ 'status': "error" })
            }
        }
    })
})
app.get('/users/usercreatesuccess', async (req, res)=>{
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    let query = UsersModel.find({})
    query.exec(async (err, allUsers) => {
        if (err){
            return res.json({ 'status': "error" })
        }
        if(req.query.useremail in allUsers){
            return res.json({ 'status': "error" })
        } else {
            let encodedPassword = "#"
            encodedPassword = bcrypt.hashSync(req.query.userpassword, 10)

            const user = await new UsersModel({ email: req.query.useremail, password: encodedPassword, name:req.query.username, age:req.query.userage });
            user.save(function (err) {
                if(err){
                    return res.json({ 'status': "error" })
                } else {
                    return res.redirect(`https://confirmed-giant-utahraptor.glitch.me/files/allocate/?useremail=${req.query.useremail}`)
                    // return res.json({ 'status': "OK" })
                }
            });
        }
    });
    
    // query.exec((err, product) => {
    //     if (err){
    //         return
    //     }
    // });

})

app.get('/files/allocate', (req, res) => {
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    
    fs.mkdir(`./uploads/${req.query.useremail.split('@')[0]}`, (err, dir) => {
        if(err){
            return res.json({ 'status': "error" })
        }
        let freespace = 0
        diskinfo.getDrives((err, aDrives) => {
            freespace = aDrives[0].available
        })
        // return res.json({ 'status': "OK" })
        return res.redirect(`https://upcload.herokuapp.com/?useremail=${req.query.useremail}&path=root&freespace=${freespace}`)
        // return res.redirect(`https://upcload.herokuapp.com/users/login`)

    })
})

app.get('/files/generatelink', async (req, res)=>{
    let encodedLink = "#"
    let alphabet = "abcdefghjiklmnoprstuvwxyz"
    
    randomWords = ''
    for(let i = 0; i < Math.floor(Math.random() * 10); i++){
        let randomIndex = Math.floor(Math.random() * alphabet.length)
        let randomLetter = alphabet[randomIndex]
        randomWords += randomLetter
    }
    encodedLink = bcrypt.hashSync(randomWords, 10)
    let query = FileModel.findOneAndUpdate({ _id: req.query.fileid }, {
        $set: {
            "linked": "true",
            "link": encodedLink
        }
    })
    query.exec((err, file) => {
        if(err){
            return res.json({ 'status': "error" })
        }
        return res.json({ 'status': "OK" })
    })
})


app.get('/files/getpreview', (req, res)=>{
        
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    
    if(req.query.filetype.includes("mp4") || req.query.filetype.includes("img") || req.query.filetype.includes("mp3")){
        res.sendFile(__dirname + `/uploads/${req.query.useremail.split('@')[0]}/${req.query.previewname}`)
    }else if(req.query.filetype.includes("txt")){
        
    }
})

app.get('/files/downloads', (req, res)=>{
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type, Accept, Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    let query = FileModel.findOne({'name': req.query.filename }, async function(err, file){
        if(!file.type.includes("group")){
            console.log("path to file", path.join(__dirname, `uploads/${req.query.useremail.split('@')[0]}/${req.query.filename}`))
            await res.download(path.join(__dirname, `uploads/${req.query.useremail.split('@')[0]}/${req.query.filename}`), `${req.query.filename}`, function (err) {
                if (err) {
                    //error to download file
                    return res.json({ "status": "error to download file" })
                } else {
                    //file success download
                    return res.json({ "status": "file success download" })
                }
            })
        } else if(file.type.includes("group")){
            let zip = new AdmZip()
            let queryOfFiles = FileModel.find({ 'path': { $regex: `${req.query.filepath}*` } })
            let filesPaths = []
            queryOfFiles.exec(async (err, files) => {
                files.map(file => {
                    if(!file.type.includes("group")){
                        filesPaths.push(`./uploads/${req.query.useremail.split('@')[0]}/${file.name}`)
                    }
                })
                console.log('filesPaths: ', filesPaths)
                filesPaths.map(path => {
                    let queryOfFile = FileModel.findOne({ name: path.split('/')[path.split('/').length - 1] })
                    queryOfFile.exec((err, file) => {
                        zip.addLocalFile(path, `${file.path}`)
                    })
                })
                
                setTimeout(() => {
                    zip.writeZip(`./uploads/${req.query.useremail.split('@')[0]}/${req.query.filename}.zip`)
                    setTimeout(() => {
                        fs.unlink(`uploads/${req.query.useremail.split('@')[0]}/${req.query.filename}.zip`, (err) => {
                            if(err) {
                                return res.json({ 'status': 'error' })
                            }
                        })  
                    }, 10000)
                }, 2000)
                
                await res.download(path.join(__dirname, `uploads/${req.query.useremail.split('@')[0]}/${req.query.filename}.zip`), `${req.query.filename}.zip`, function (err) {
                    if (err) {
                        //error to download file
                        return res.json({ "status": "error to download file" })
                    } else {
                        //file success download
                        return res.json({ "status": "file success download" })
                    }
                })
            })
        }
    })
})

app.get('**', (req, res) => {
    console.log('redirect')
    return res.redirect(`/?redirectroute=${req.path}`)
})

const port = process.env.PORT || 8080
// const port = 4000
app.listen(port)
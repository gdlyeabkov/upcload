process.setMaxListeners(1500);
const { lsDevices } = require('fs-hard-drive')
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
var newfiles = []
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `uploads/${req.query.owner.split('@')[0]}/`)
    },
    filename: function (req, file, cb) {
        console.log('step2')
        // cb(null, file.originalname)

        let indexOfCalls = 0
        function dontRepeatFilesNames(changedFileName) {
            indexOfCalls++
            let filesInDir = []
            console.log('file: ', file)
            fs.readdir(`./uploads/${req.query.owner.split('@')[0]}/`, (err, userFiles) => {
                filesInDir = userFiles
                if(filesInDir.length >= 1){
                    if(filesInDir.includes(changedFileName)){
                        dontRepeatFilesNames(`${file.originalname.split('.')[0]}(${indexOfCalls}).${file.originalname.split('.')[1]}`)
                    } else {
                        let fileType = "img"
                        if(file.mimetype.includes("img")){
                            fileType = "img"
                        } else if(file.mimetype.includes("mp4")){
                            fileType = "mp4"
                        } else if(file.mimetype.includes("audio")){
                            fileType = "mp3"
                        }
                        newfiles.push(changedFileName)
                        new FileModel({ name: changedFileName, size: file.size, type: fileType, path: req.query.filepath, owner: req.query.owner }).save(function (err) {
                            if(err){
                                // return res.json({ "status": "error" })
                            }
                        })
                        cb(null, changedFileName) 
                    }
                } else {
                    let fileType = "img"
                    if(file.mimetype.includes("img")){
                        fileType = "img"
                    } else if(file.mimetype.includes("mp4")){
                        fileType = "mp4"
                    } else if(file.mimetype.includes("audio")){
                        fileType = "mp3"
                    }
                    newfiles.push(changedFileName)
                    new FileModel({ name: changedFileName, size: file.size, type: fileType, path: req.query.filepath, owner: req.query.owner }).save(function (err) {
                        if(err){
                            // return res.json({ "status": "error" })
                        }
                    })
                    cb(null, changedFileName)
                }  
            })
        }
        dontRepeatFilesNames(file.originalname)
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
    size: {
        type: Number,
        default: 0
    },
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
    },
    updated: {
        type: Date,
        default: Date.now
    }
});

const FileModel = mongoose.model('FileSchema', FileSchema);

const UsersSchema = new mongoose.Schema({
    email: String,
    password: String,
    name: String,
    age: Number,
    size: {
        type: Number,
        default: 4194304
    }
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
        let queryOfUser = UsersModel.findOne({ email: req.query.useremail })
        queryOfUser.exec((err, user) => {
            if (err){
                return
            }
            // return res.render('index', { allFiles: allFiles, auth: true, useremail: 'gleb@mail.ru' })
            return res.json({ allFiles: allFiles, user: user, auth: "true", useremail: req.query.useremail })
        })
    })
})

app.post('/files/upload', upload.array('myFiles', 999), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    const files = req.files
    console.log(`newfiles: ${newfiles.length}`)
    if(!files){
        console.log("Error to upload file ")
    }
    console.log('step1')
    let fileIndex = -1
    for(let file of req.files){
        fileIndex++
        console.log(`newfiles: ${newfiles[fileIndex]}`)
    //     let fileType = "img"
    //     if(file.mimetype.includes("img")){
    //         fileType = "img"
    //     } else if(file.mimetype.includes("mp4")){
    //         fileType = "mp4"
    //     } else if(file.mimetype.includes("audio")){
    //         fileType = "mp3"
    //     }
        // fs.rename(`./uploads/${file.filename}`, `./uploads/${req.query.owner.split('@')[0]}/${file.filename}`, (err, file) => {
        //     if(err) {
        //         return res.json({ "status": "error" })
        //     }
        // })
        FileModel.updateOne({ "name": newfiles[fileIndex] }, 
        { 
            "size": file.size
        }, (err, user) => {
            if(err){
                
            }
        })
    }
    let freespace = 0
    diskinfo.getDrives((err, aDrives) => {
        if(err) {
            freespace = 0    
        }
        freespace = aDrives[0].available
    })

    let totalSize = 0
    for(let file of req.files){
        totalSize += file.size
    }
    console.log(`totalSize: ${totalSize}`)
    UsersModel.updateOne({ email: req.query.owner }, 
        { 
            "$inc": { "size": -totalSize }
        }, (err, user) => {
        if(err){
            return res.json({ 'status': 'error' })
        }
        
    })
    newfiles = []
    return res.redirect(`https://upcload.herokuapp.com/?useremail=${req.query.owner}&path=${req.query.filepath}&search=`)
    // return res.redirect(`http://localhost:8080/?useremail=${req.query.owner}&path=${req.query.filepath}&search=`)

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

    // let fileids = req.query.fileids.split(',')
    // let countOfFiles = fileids.length
    // console.log('fileids: ', fileids)
    // for(let fileIndex = 0; fileIndex < countOfFiles; fileIndex++){
    //     let queryOfFile = FileModel.findOne({"_id": fileids[fileIndex] })
    //     queryOfFile.exec((err, file) => {
    //         if(!file.type.includes('group')){
    //             console.log("file: ", file)
    //             if(err){
    //                 return res.json({ 'status': 'error' })
    //             }
    //             fs.unlink(`uploads/${req.query.owner.split('@')[0]}/${file.name}`, (err) => {
    //                 if(err) {
    //                     return res.json({ 'status': 'error' })
    //                 }
    //             })  
    //         }
    //     })
    // }
    // let query = FileModel.find({ })
    // query.exec((err, allFiles) => {
    //     let queryOfDelete = FileModel.deleteMany({ "_id": { $in: fileids } })
    //     queryOfDelete.exec((err, data) => {
    //         if(err){
    //             return res.json({ 'status': 'error' })
    //         }
    //         return res.json({ 'allFiles': allFiles })
    //     })
    // })

    console.log('req.query.fileids.split(,): ', req.query.fileids.split(','))
    if(req.query.fileids.includes(',')){
        for(let fileId of req.query.fileids.split(',')){
            let queryOfFile = FileModel.findOne({"_id": fileId })
            queryOfFile.exec((err, file) => {
                if(err){
                    return res.json({ 'status': 'error' })
                }
                if(!file.type.includes('group')){
                    fs.unlink(`uploads/${req.query.owner.split('@')[0]}/${file.name}`, (err) => {
                        if(err){
                            return res.json({ 'status': 'error' })
                        }
                    })
                }
                let queryOfDelete = FileModel.deleteOne({ "_id": { $in: req.query.fileids.split(',') } })
                queryOfDelete.exec((err, data) => {
                    if(err){
                        return res.json({ 'status': 'error' })
                    }
                })

            })
        }
        return res.json({ 'status': 'OK' })
    } else if(!req.query.fileids.includes(',')){
        let totalSize = 0
        let queryOfFile = FileModel.findOne({"_id": req.query.fileids })
        queryOfFile.exec((err, file) => {
            if(err){
                return res.json({ 'status': 'error' })
            }
            if(!file.type.includes('group')){
                fs.stat(`uploads/${req.query.owner.split('@')[0]}/${file.name}`, (err, stats) => {
                    if(err){
                        return res.json({ 'status': 'error' })
                    }
                    totalSize += stats.size
                })
                fs.unlink(`uploads/${req.query.owner.split('@')[0]}/${file.name}`, (err) => {
                    if(err){
                        return res.json({ 'status': 'error' })
                    }
                })
            }
            let queryOfDelete = FileModel.deleteOne({ "_id": req.query.fileids })
            queryOfDelete.exec((err, data) => {
                if(err){
                    return res.json({ 'status': 'error' })
                }
                UsersModel.updateOne({ email: req.query.owner }, 
                { 
                    "$inc": { "size": totalSize }
                }, (err, user) => {
                    if(err){
                        return res.json({ 'status': 'error' })
                    }
                    
                })
            })
        })
    }

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
        return res.redirect(`https://upcload.herokuapp.com/?useremail=${req.query.useremail}&path=root&search=`)
        // return res.redirect(`https://upcload.herokuapp.com/users/login`)

    })
})

app.get('/files/generatelink', async (req, res)=>{
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    

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
            "link": `https://upcload.herokuapp.com/links/${encodedLink}`
        }
    })
    query.exec((err, file) => {
        if(err){
            return res.json({ 'status': "error" })
        }
        return res.json({ 'status': "OK", "link": `https://upcload.herokuapp.com/links/${encodedLink}` })
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
                        let newPath = file.path.split(file.path.split(req.query.filename)[0])[1]
                        zip.addLocalFile(path, `${newPath}`)
                    })
                })
                
                setTimeout(async () => {
                    zip.writeZip(`./uploads/${req.query.useremail.split('@')[0]}/${req.query.filename}.zip`)
                    await res.download(path.join(__dirname, `uploads/${req.query.useremail.split('@')[0]}/${req.query.filename}.zip`), `${req.query.filename}.zip`, function (err) {
                        if (err) {
                            //error to download file
                            return res.json({ "status": "error to download file" })
                        } else {
                            //file success download
                            return res.json({ "status": "file success download" })
                        }
                    })
                    setTimeout(() => {
                        fs.unlink(`uploads/${req.query.useremail.split('@')[0]}/${req.query.filename}.zip`, (err) => {
                            if(err) {
                                return res.json({ 'status': 'error' })
                            }
                        })  
                    }, 10000)
                }, 2000)
                
                // await res.download(path.join(__dirname, `uploads/${req.query.useremail.split('@')[0]}/${req.query.filename}.zip`), `${req.query.filename}.zip`, function (err) {
                //     if (err) {
                //         //error to download file
                //         return res.json({ "status": "error to download file" })
                //     } else {
                //         //file success download
                //         return res.json({ "status": "file success download" })
                //     }
                // })
            })
        }
    })
})

app.get('/diskinfo', (req, res) => {
    let freespace = 0
    diskinfo.getDrives((err, aDrives) => {
        if(err) {
            freespace = 0
        }
        aDrives.map((drive) => {
            freespace += drive.available
        })
    })
    console.log(`freespace: ${freespace}`)
    return res.json({ 'freespace': freespace })
})

app.get('**', (req, res) => {
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    
    console.log('redirect')
    console.log('req.path: ', req.path)
    if(req.path.includes('links')){
        let queryOfFile = FileModel.find({ 'link': req.query.path })
        queryOfFile.exec((err, file) => {
            if (err){
                // return res.redirect(`http://localhost:8081/?redirectroute=${req.path}`)
                return res.redirect(`/?owner=${file.owner}&path=${file.path}&search=&redirectroute=https://upcload.herokuapp.com${req.path}`)
            }
            // return res.redirect(`http://localhost:8081/?redirectroute=http://localhost:8081${req.path}&owner=${file.owner}&path=${file.path}`, 300)
            return res.redirect(`/?owner=${file.owner}&path=${file.path}&search=&redirectroute=https://upcload.herokuapp.com${req.path}`)
        })
    }
    // return res.redirect(`http://localhost:8081/?redirectroute=${req.path}`)
    return res.redirect(`/?owner=${file.owner}&path=${file.path}&search=&redirectroute=https://upcload.herokuapp.com${req.path}`)
})

const port = process.env.PORT || 8080
// const port = 4000
app.listen(port)
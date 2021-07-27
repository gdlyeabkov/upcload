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
    moneys:{
        type: Number,
        default: 0
    },
    productsInBucket:[mongoose.Schema.Types.Map]
},
{ collection : 'myusers' });
const UsersModel = mongoose.model('UsersModel', UsersSchema, 'myusers');

app.get('/home',(req, res)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    
    //получение всех файлов
    let queryOfFiles = FileModel.find({})
    queryOfFiles.exec((err, allFiles) => {
        if (err){
            return
        }
        // return res.render('index', { allFiles: allFiles, auth: true, useremail: 'gleb@mail.ru' })
        return res.json({ allFiles: allFiles, auth: "true", useremail: 'gleb@mail.ru' })
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
        await new FileModel({ name: file.filename, size: file.size, type: fileType, path: req.query.filepath }).save(function (err) {
            if(err){
                return res.json({ "status": "error" })
            }
        })
    }
    return res.redirect('http://localhost:8080/')
})

app.get('/files/createfolder', (req,res)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    new FileModel({ name: req.query.filename, size: 0, type: "group", path: req.query.filepath }).save(function (err) {
        if(err){
            return res.json({ "status": "error" })
        }
        return res.json({ "status": "OK" })
    })
})

app.get('/users/check', (req,res)=>{
    //let query =  UsersModel.find({}).select(['email']);
    let query =  UsersModel.findOne({'email': req.query.useremail}, function(err, user){
        if (err){
            return
        } else {
            if(user != null && user != undefined && req.query.userpassword == user.password){
                auth = true
                res.redirect(`/?useremail=${user.email}&error=no`)
            } else {
                res.send(`user not found`)    
            }
            console.log(user)
            
        }
    })
    // query.exec((err, allUsers) => {
    //     if (err){
    //         return
    //     }
    //     console.log(req.query)
    //     console.log(allUsers)
        /*
        allUsers.map((user) => {
            if(user.email && user.email == req.query.useremail){
                auth = true
                res.redirect(`/?useremail=${req.query.useremail}&error=no`)
            }
            else {
                res.redirect(`/?error=notAuth`)
            }
        })
        */
       
        // if(req.query.useremail in allUsers){
            // auth = true
            // res.redirect(`/?useremail=${req.query.useremail}&error=no`)
        // } else {
            // res.redirect(`/?error=notAuth`)
        // }
            
    // });
})
app.get('/users/usercreatesuccess',async (req, res)=>{
    //let query = await UsersModel.create({ email: 'rodion@mail.ru', password:req.params.userpassword.toString(), name:req.params.username, age:req.params.userage });
    let query = UsersModel.find({}).select(['email']);
    query.exec(async (err, allUsers) => {
        if (err){
            return
        }
        
        if(req.query.useremail in allUsers){
            console.log(req.query.useremail in allUsers)
            res.redirect('/users/register',{ userlogin:true}) 
        } else {
            const user = await new UsersModel({ email: req.query.useremail, password:req.query.userpassword, name:req.query.username, age:req.query.userage });
            user.save(function (err) {
                if(err){
                    return
                } else {
                    //localStorage.setItem('logined', 'true')
                    // res.redirect('/users/register')
                    //res.redirect(`/users/usercreatesuccess?useremail=${useremail}&userpassword=${userpassword}&username=${username}&userage=${userage}`)
                    auth = true
                    res.render('usercreatesuccess', {userlogin: true, useremail: req.query.useremail})
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
})


app.get('/games/getpreview', (req, res)=>{
        
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    
    res.sendFile(__dirname + `/uploads/${req.query.previewname}.png`)

})

app.get('/files/downloads', (req, res)=>{
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type, Accept, Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    let query = FileModel.findOne({'name': req.query.filename }, async function(err, game){
        console.log("path to file", path.join(__dirname, `uploads/${req.query.filename}.txt`))
        await res.download(path.join(__dirname, `uploads/${req.query.filename}.txt`), `${req.query.filename}.txt`, function (err) {
            if (err) {
                //error to download file
                return res.json({ "status": "error to download file" })
            } else {
                //file success download
                return res.json({ "status": "file success download" })
            }
        })
    })
})

const port = process.env.PORT || 8080

app.listen(4000)
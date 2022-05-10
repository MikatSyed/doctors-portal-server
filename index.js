const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra')
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.du7xt.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('doctors'))
app.use(fileUpload())

const port = 6700;
app.get('/', (req, res) => {
    res.send('Hello! I am Working')
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {  
    // console.log(err);
  const appoinmentCollection = client.db("doctorsPortal").collection("appoinment");
  const doctorCollection = client.db("doctorsPortal").collection("doctors");
   

 

  app.get('/allPatient',(req, res)=>{
    appoinmentCollection.find()
    .toArray((err,result)=> {
        res.send(result);
    })
})

    app.post('/addAppoinment',(req, res) =>{
        const appoinment = req.body;
        // console.log(appoinment);
        appoinmentCollection.insertOne(appoinment)
        .then(result =>{
            // res.send(result.insertedCount > 0)     
            console.log(result);
        })
    })

    
   //post appoinment
    app.post('/appoinmentsByDate',(req, res) =>{
        const date = req.body;  
        const email = req.body.email; 
        // console.log(date.date);
        
        doctorCollection.find({email: email})
        .toArray((err,doctor) =>{
            const filter = {date : date.date}
           if(doctor.length === 0){
               filter.email = email;
           }
           appoinmentCollection.find(filter)
           .toArray((err,documents) =>{
               res.send(documents)
           })
        })

      
    })

    //post doctor
    app.post('/addDoctor',(req, res)=>{

        const name = req.body.name;
        const email  = req.body.email;
        const file = req.files.file;
        const filePath = `${__dirname}/doctors/${file.name}`
        file.mv(filePath,err=>{
            if(err){
                console.log(err);
                return res.status(500).send({msg:'Failed to reload'})
            }
            // return res.send({name: file.name,path:`/${file.name}`})
            const newImg = fs.readFileSync(filePath)
            const encImg = newImg.toString('base64')

            var image = {
                 contentType : req.files.file.mimetype,
                 size : req.files.file.size,
                 img : Buffer.from(encImg,'base64')
            }
            doctorCollection.insertOne({ name, email,image})
         
            .then(result => {
                // console.log(result)
                // fs.remove(filePath,error => {
                //     if(error){
                //         console.log(error)
                //         return res.status(500).send({msg:'Failed to reload'})
                //     }
                    res.send(result.acknowledged == true)
                // })
              
            })
        })
      
      })
    

//get doctors data from database
app.get("/doctors", (req, res) => {
    doctorCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  })


//check doctor
app.post('/checkDoctor',(req, res) =>{
    const email = req.body.email; 
    doctorCollection.find({email: email})
    .toArray((err,doctor) =>{
        res.send(doctor.length > 0)
       }) 
    })

});



app.listen( process.env.PORT || port);
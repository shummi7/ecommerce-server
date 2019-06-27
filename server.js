const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');

const app=express();
app.use(bodyParser.json());
app.use(cors());


const postgres= knex({
    client: 'pg',
    connectionString: process.env.DATABASE_URL,
    ssl: true,

  });


app.get('/',(req,res)=>{res.json('yaay It is working');})

app.post('/collection',(req,res)=>{
    postgres.select('*').from(req.body.collection)
    .then(data=>{
        // console.log(data);
        // console.log(req.body.collection);
        res.json(data);
    }
    )
})

app.post('/testing',(req,res)=>{
    postgres.select('*').from('dress')
    .then(data=>{
        // console.log(data);
        // console.log(req.body.collection);
        res.json(data);
    }
    )
})

app.post('/product',(req,res)=>{
    postgres.select('*').from(req.body.producttable)
    .where({productcode:req.body.productcode})
    .then(data=>{
        // console.log("heloooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo",data);
        res.json(data);
        // console.log(data);
    }
    )
})

app.post('/featuredproduct',(req,res)=>{
    postgres.select('*').from(req.body.table)
    .then(data=>{
        // console.log(data);
        var dataRandom= data[Math.floor(Math.random() * data.length)];
        res.json(dataRandom);
    }
    )
})

app.post('/cart',(req,res)=>{
    console.log('checking',req.body.addtocart);
    postgres('users')
    .where('id','=', req.body.id).returning("*")
    .update({
      cart: req.body.addtocart
    })
    .then(data=>{
        res.json(data[0]);
        console.log('data[0].cart',data[0].cart);
    })
})

app.post('/search',(req,res)=>{
    const filteredCode=[]
    const arr=['dress','headphones','cameras','phones','watches','laptops'];
    for(var i=0;i<arr.length;i++){
    postgres.select('productname','productcode').from(arr[i])
    .returning("*")
    .then(data=>{        
            const filteredData = data.filter(dataarr =>{
                
              if( dataarr.productname.toLowerCase().includes(req.body.word)){
                filteredCode.push(dataarr.productcode);
                return(filteredCode);
              }
            })
       })
    }
    setTimeout(() => {
        res.json(filteredCode);
      }, 500)
  

    //     postgres.select('productname','productcode').from('dress')
    // .returning("*")
    // .then(data=>{
    //     const filteredCode=[]
    //         const filteredData = data.filter(dataarr =>{
                
    //           if( dataarr.productname.toLowerCase().includes("white")){
    //             filteredCode.push(dataarr.productcode);
    //             return(filteredCode);
    //           }
    //         })
    //         res.json(filteredCode);
    //         console.log(filteredCode);
    //     })

})

app.post('/userdetails',(req,res)=>{
    postgres('users')
    .where('id','=', req.body.id).returning("*")
    .then(data=>{
        res.json(data[0]);
    })
})

app.post('/signin', (req,res) => {
    postgres.select('email','hash').from('login')
    .where('email','=',req.body.email)
    .then(data =>{
        const isValid= bcrypt.compareSync(req.body.password,data[0].hash);
        if(isValid){
            return postgres.select('*').from('users')
            .where('email','=',req.body.email)
            .then(user=> {res.json(user[0])})
            .catch(err=> res.json('unable to get user'))
        }
        else{
            res.status(400).json('wrong credentials');
        }
    }) 
    .catch(err=> res.status(400).json('wrong credential'));
});

app.post('/register', (req,res) => {
    const bhash = bcrypt.hashSync(req.body.password);
    postgres.transaction(trx=>{
        trx.insert({
            email: req.body.email,
            hash:bhash
        }).into('login').returning('email')
        .then(retemail =>{
            return trx('users').returning('*').insert({
                email : retemail[0],
                name : req.body.name,
                joined : new Date()
            })
            .then(user=>{
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err=> res.status(400).json(err));
});


app.listen(process.env.PORT || 3001,()=>{console.log('port 3001 server listening');})
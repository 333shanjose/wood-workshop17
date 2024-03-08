const express=require('express')
const cors = require('cors');
const multer  = require('multer')
const { MongoClient } = require('mongodb');
var objectId=require('mongodb').ObjectId;
var dbs=require('./database')
var fs = require('fs');
const path = require("path");
var cookieParser = require('cookie-parser');

const uri= "mongodb+srv://football-99:fRF07vXpMk2fnYt1@cluster0.oeca437.mongodb.net/?retryWrites=true&w=majority"
const client = new MongoClient(uri);
client.connect()
const db = client.db('users');
const app=express()
const { response } = require('express');
var session=require('express-session');
const corsOptions = {
  origin: 'https://wood-workshop17.vercel.app',  //Your Client, do not write '*'
  credentials: true,
};
app.use(express.static(path.join(__dirname, "build")));
app.use((_, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});
app.use(cors(corsOptions));

app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret:'key',resave:false,saveUninitialized: false,cookie:{maxAge:600000}}))







const storage = multer.diskStorage({
    destination: function (req, file, cb) {               
      cb(null, './client/public/images')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now()
      cb(null,file.originalname)
    }
  })
  
  const upload = multer({ storage: storage })





app.post('/admin/addproduct',upload.single('image'),(req,res)=>{
  console.log('ll')
 req.body.price=parseInt(req.body.price)
    console.log(req.file.filename)
  let f={...req.body, ...req.file}
  
   db.collection('p').insertMany([f]).then((res)=>{
    console.log(res)
})
})
 app.get('/admin/getp',async(req,res)=>{
    

   db.collection('p').find().toArray().then((products)=>{
       res.json({products})
      
      })
  
   
 })   
 app.get('/cartt/:id',async(req,res)=>{
   return new Promise(async(resolve,reject)=>{
   let proId=req.params.id
   let proObj={
     
     item:new objectId(proId),
     quantity:1
     
   }  
   let cartObj={
    item:new objectId(proId),
    products:[proObj]
   }
    let pro=await db.collection('cart').findOne({'products.item':new objectId(proId)})
      if(pro){
         db.collection('cart').updateOne({item:new objectId(proId),'products.item':new objectId(proId)},
         {
           $inc:{'products.$.quantity':1}
         })
      }
     else{
      
   
    db.collection('cart').insertMany([cartObj]).then((res)=>{
      console.log(res)
    })
  
     }
    })

 })
  app.get('/cart-pages',(req,res)=>{
    db.collection('cart').aggregate([
      
     {
       $unwind:'$products'
     },
     {
      $project:{
        item:'$products.item',
        quantity:'$products.quantity'
    },
},
{
    $lookup:{
        from:'p',
        localField:"item",
        foreignField:"_id",
        as:'product'
    }
},


{
  $project:{

    item:1,
    quantity:1,
    product:{$arrayElemAt:['$product',0]}, 
     


}
}

]).toArray().then((cart)=>{
   console.log('ll')
  res.json({cart}) 
})  
  })  


  app.post('/count',(req,res)=>{
    dbs.getQuantity(req.body).then(async(response)=>{
      response.total=await dbs.getTotal(req.body.cart)
      res.json(response)
    })
  })
  app.post('/place-order',(req,res)=>{
     console.log(req.body)
     let status=req.body['payment-method']==='bank'? 'placed': 'pending'
     let orderObj={
       name:req.body.names,
       method:req.body['payment-method'],
       status:status,
       date:new Date()

     }
      db.collection('order').insertOne(orderObj).then((response)=>{
         res.json('order placed successfully')
      })
    })
  
    app.get('/place-order',async(req,res)=>{
      console.log(req.session.adminf)

      db.collection('order').find().toArray().then((order)=>{
          res.json({order})
         
         })
     
      
    })  
  app.get('/total',async(req,res)=>{
   let totals=await db.collection('cart').aggregate([
       
        
      {
          $unwind:'$products'
      },
      {
          $project:{
              item:'$products.item',
              quantity:'$products.quantity'
          }
      },
      {
          $lookup:{
              from:'p',
              localField:"item",
              foreignField:"_id",
              as:'product'
          }
      },
      {
       $project:{
           
        item:1,
        quantity:1,
        product:{$arrayElemAt:['$product',0]}
       }
    },
    {
      $project:{
          
          total:{$sum:{$multiply:['$quantity','$product.price']}}
      }
  },
    
    
              // let:{prodetails:"$products"},
               //pipeline:[
                   //{
                     // $match:{
                         // $expr:{
                            //  $in:['$_id',"$$prodetails"]
                         // }
                     // }
                   //}
              // ],
                //as:'cartItem'


               
          // }
       //
     
      
  ]).toArray()
   console.log(totals)
  res.json({totals})  
  })

  app.get('/totals',async(req,res)=>{
    let total=await dbs.getTotal()
     res.json(total)
  })
  app.post('/admin/signup',(req,res)=>{
     dbs.doSignup(req.body).then((res)=>{

     })
     res.json('signup successfully')
  })
  app.post('/admin/login',(req,res)=>{
     dbs.doLogin(req.body).then((response)=>{
       if(response.status){
         req.session.adminf=response.admin
          
        req.session.adminf.loggedIn=true
        
       }else{
        req.session.adminLoginErr="invalid username or password"
         
       }
      res.json({response})
     })
    
  })
  app.get('/admin/login',async(req,res)=>{
    let adminss=req.session.adminf
     res.json({adminss})
})
app.get('/admin/editproducts/:id',async(req,res)=>{
  let proId=req.params.id
 let products=await dbs.getProducts(proId)   
  res.json({products})  
});

app.post('/admin/editproducts/:id',upload.single('image'),(req,res)=>{
   
     console.log(req.body.image)
   dbs.updateOne(req.params.id,req.body).then((response)=>{
    res.json({response})

  })

     
 
})
 app.get('/admin/deleteproducts/:id',(req,res)=>{
   let proId=req.params.id
   console.log(proId)
    db.collection('p').deleteOne({_id:new objectId(proId)}).then((res)=>{

    })
 })
 
  app.get('/admin/logout',(req,res)=>{
     req.session.adminf=null
      let f=req.session.adminf
      res.json(f)
  }) 
    

app.listen('4002',()=>{
    console.log('server running')
})

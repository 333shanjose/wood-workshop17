const { MongoClient } = require('mongodb');
var objectId=require('mongodb').ObjectId;

const uri= "mongodb+srv://football-99:fRF07vXpMk2fnYt1@cluster0.oeca437.mongodb.net/?retryWrites=true&w=majority"
const client = new MongoClient(uri);
client.connect() 
const db = client.db('users');
const bcrypt=require('bcrypt')

  
  module.exports={
     
    getQuantity:(details)=>{
        count=parseInt(details.count)
        quantity=parseInt(details.quantity)
        console.log(count)
        return new Promise(async(resolve,reject)=>{
            if (details.count==-1 && details.quantity==1){
                db.collection('cart').updateOne({_id:new objectId(details.cart)},
                {
                    $pull:{products:{item:new objectId(details.proId)}}
                }    
                ).then((response)=>{
                    resolve({removeproduct:true})
                })
            }else{
        db.collection('cart').updateOne({item:new objectId(details.proId),'products.item':new objectId(details.proId)},
        {
           $inc:{'products.$.quantity':count} 
        }
      
        ).then((response)=>{
          resolve({status:true})
        })   
    }
            
        
    
        
     
        
    
})
},
getTotal:(cartId)=>{
        
       console.log(cartId)         
                    
    return new Promise(async(resolve,reject)=>{
      
    
    let total=await db.collection('cart').aggregate([
       
        
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
             
              item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
         }
      },
      {
        $group:{
           _id:null, 
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
    console.log(total)

    resolve(total[0].total)
})
},

  
//admin


doSignup:(adminData)=>{
    
    return new Promise(async(resolve,reject)=>{
        adminData.password=await bcrypt.hash(adminData.password,10)
            
        db.collection('admin').insertOne(adminData).then((response)=>{
            resolve(response)
             
        })
    })
  
  },

  doLogin:(adminData)=>{
    return new Promise(async(resolve,reject)=>{
   
    let response={}
    let admin=await db.collection('admin').findOne({email:adminData.email})
    if(admin){
        bcrypt.compare(adminData.password,admin.password).then((status)=>{
          if(status){
              console.log("loggin sucess");
              response.admin=admin
              response.status=true
              resolve(response)
          }else{
              console.log("loggin failed");
              resolve({status:false})
          }
        })
    }else{
        console.log("loggin failed");
        resolve({status:false});
    }
  
  })
  },

  getProducts:(Id)=>{
    return new Promise((resolve,reject)=>{
       console.log(Id)
   
      db.collection('p').findOne({_id:new objectId(Id)}).then((products)=>{
        resolve(products)      
    })
  })

 },
 updateOne:(proId,prodetails,pro)=>{
    return new Promise((resolve,reject)=>{
     db.collection('p').updateOne({_id:new objectId(proId)},{
       $set:{
         names:prodetails.names,
         description:prodetails.description,
         price:prodetails.price,
         filename:prodetails.image
       }
     }).then(()=>{
       resolve()
     })
    })
  },
}
    
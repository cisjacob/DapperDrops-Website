const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const isAuth = function(req, res, next){
    if(req.session.isAuth){
        next();
    } else {
        res.redirect('/account/login');
    }
}

const isAdmin = function(req, res, next){
    if(req.session.accountType === "admin"){
        req.session.isAdmin = true;
        next();
    } else {
        res.redirect('/');
    }
}

const Product = require("../../models/productModel");


var fs = require('fs');
var path = require('path');

const multer = require("multer")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '_' + Date.now() + "_" + file.originalname)
    }
});
  

const upload = multer({
    storage: storage, 
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.jfif') {
            return callback(new Error('Only images are allowed'))
        }
        callback(null, true)
    },
    limits:{
        fileSize: 1024 * 1024
    }
}).single('productImage');



router.get("/", isAuth, isAdmin, async function (req, res) {   
    // Product.find({}, function (err, allInventory) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         res.render('admin/inventory', { newListInventory: allInventory })
    //     }
    // });
      //     $lookup: {
    //         from: "inventories", // collection to join
    //         localField: "_id",//field from the input documents
    //         foreignField: "_id",//field from the documents of the "from" collection
    //         as: "productDetails"// output array field
    //     }
    // }, 
    // {
    //     $unwind:'$productDetails'
    // },
    // {
    //     $addFields:{
    //         sales:'$productDetails.sales', sold:'$productDetails.sold',status:'$productDetails.status'
    //     }
    //     },
    //unwide and addfields removes array and adds it to the products collection.
    let { stype, sdir, ftype, fvalue } = req.query;
    if(!stype && !sdir && !ftype && !fvalue){
        console.log('tangina')
        products = await Product.aggregate([{
            $project:{
                "category":"$category",
                "brand": "$brand",
                "name": "$name",
                "totalEarnings": "$totalEarnings",
                "totalQuantitySold": "$totalQuantitySold",
                "itemsRemaining":{
                    $sum: "$variations.quantity"
                }
            }
        }]);
    } else if (!stype && !sdir) {
        console.log("ETOOOO 31232131")
        products = await Product.aggregate([
            { $match: {
                [ftype]: fvalue
            } },
            { $project:{
                "category":"$category",
                "brand": "$brand",
                "name": "$name",
                "totalEarnings": "$totalEarnings",
                "totalQuantitySold": "$totalQuantitySold",
                "itemsRemaining":{
                    $sum: "$variations.quantity"
                }
            } }
        ]);

        // products = await Product.find({ [ftype] : fvalue });
    } else if (!ftype && !fvalue) {
        console.log("ETOOOO 3")
        products = await Product.aggregate([
            { $project:{
                "category":"$category",
                "brand": "$brand",
                "name": "$name",
                "totalEarnings": "$totalEarnings",
                "totalQuantitySold": "$totalQuantitySold",
                "itemsRemaining":{
                    $sum: "$variations.quantity"
                }
            } },
            { $sort: {
                [stype] : parseInt(sdir)
            } }
        ]);

        console.log(products);
        // products = await Product.find({}).sort({ [stype] : sdir });
    } else {
        console.log("ETOOOO 4")
        products = await Product.aggregate([
            { $match: {
                [ftype]: fvalue
            } },
            { $project:{
                "category":"$category",
                "brand": "$brand",
                "name": "$name",
                "totalEarnings": "$totalEarnings",
                "totalQuantitySold": "$totalQuantitySold",
                "itemsRemaining":{
                    $sum: "$variations.quantity"
                }
            } },
            { $sort: {
                [stype] : parseInt(sdir)
            } }
        ]);
    }
    
    const brands = await Product.aggregate([
        { $group: {
            _id: {
                brand: "$brand"
            }
        } }
    ]).sort({ "_id.brand": 1 });
    
    res.render('admin/inventory', {
        newListInventory: products,
        brands: brands,
        stype: stype,
        sdir: sdir,
        ftype: ftype,
        fvalue: fvalue,
        fullName: req.session.firstName + " " + req.session.lastName})

});

router.get('/search-inventory', async function(req, res){
    let { stype, sdir } = req.query;
    let query = req.query.query;
    let searchedProducts, brands;

    if(!query) {
        query = "";
    }

    if(!stype || !sdir){
        searchedProducts = await Product.aggregate([
            { $match: 
                { $or: [
                    { name: { $regex: query, $options: 'i'} },
                    { brand: { $regex: query, $options: 'i'} },
                ] }
            },
            { $project: {
                "category":"$category",
                "brand": "$brand",
                "name": "$name",
                "totalEarnings": "$totalEarnings",
                "totalQuantitySold": "$totalQuantitySold",
                "itemsRemaining":{
                    $sum: "$variations.quantity"
                }
            } }
        ]);
    } else {
        searchedProducts = await Product.aggregate([
            { $match: 
                { $or: [
                    { name: { $regex: query, $options: 'i'} },
                    { brand: { $regex: query, $options: 'i'} },
                ] }
            },
            { $project: {
                "category":"$category",
                "brand": "$brand",
                "name": "$name",
                "totalEarnings": "$totalEarnings",
                "totalQuantitySold": "$totalQuantitySold",
                "itemsRemaining":{
                    $sum: "$variations.quantity"
                }
            } },
            { $sort: {
                [stype] : parseInt(sdir)
            }}
        ]);
    }
    

    console.log(searchedProducts)

    res.render('admin/search-inventory', {
        newListInventory: searchedProducts,
        stype: stype,
        sdir: sdir,
        query: query,
        fullName: req.session.firstName + " " + req.session.lastName})
});

router.get("/:productId/view", isAuth, isAdmin, upload, function(req, res){
    const productId = req.params.productId;

    Product.findOne({ _id:productId }, function(err, allProducts){
        res.render('admin/view-product', { newListProducts:allProducts,
            fullName: req.session.firstName + " " + req.session.lastName
        });
    })
});

router.get("/:productId/delete", isAuth, isAdmin, function(req, res){
    const productId = req.params.productId;
    Product.findByIdAndRemove({ _id:productId }, function(err, result){
        if(result.image != ''){
            try{
                fs.unlinkSync('public/uploads/' + result.image)
            }catch(err){
                console.log(err)
            }
        }
        if(err){
            console.log(err);
        } else {
            res.redirect('/admin/inventory')
        }
    
    });
});

router.get("/update-variation/:variationId-:productId", isAuth, isAdmin, upload, function(req, res){
    const variationId = req.params.variationId;
    const productId = req.params.productId;
    console.log(variationId);

    Product.findById({_id: productId}, function(err, product){
        if(err){
            console.log(err);
        }
        else{
            const variation = product.variations.find(obj => obj.id === variationId);
            console.log(variation);
            
            res.render('admin/update-variation', {fullName: req.session.firstName + " " + req.session.lastName, product: product, variation: variation});
        }
    });     
});

router.get("/:productId/add-new-variation", isAuth, isAdmin, function(req, res){
    const productId = req.params.productId;
    console.log(productId);
    Product.findOne({ _id:productId }, function(err, product){
        res.render('admin/add-new-variation', {
            fullName: req.session.firstName + " " + req.session.lastName,
             product:product
        });
    })
});

router.post("/:productId/add-new-variation", isAuth, isAdmin, function(req, res){
    const productId = req.params.productId;
    console.log(productId);
    Product.findOne({ _id:productId }, function(err, product){
        res.render('admin/add-new-variation', {
            fullName: req.session.firstName + " " + req.session.lastName,
             product:product
        });
    })
});

router.post("/:productId/add-new-variation", isAuth, isAdmin, function(req, res){
    const {productId, name, quantity} = req.body;
    let status="";
    console.log(req.body);
    if(quantity >= 6){
        status = "In-Stock";
   }
   else if(quantity <= 5 && quantity >=1){
        status = "Few-Stocks";
   }
   else if(quantity == 0){
        status = "Out-of-Stock";
   }
   const variation = {
    name: name,
    quantity: quantity,
    status: status
};
   console.log(variation);
   if(req.body.button == "submit"){
    Product.findByIdAndUpdate({"_id" : productId }, { $push: { 
        variations: [variation],
    }}, function(err, product){
            if(err){
                console.log(err);
            } else {
                res.redirect('/admin/inventory')
            }
        });
   }
   else if(req.body.button == "add"){
    Product.findByIdAndUpdate({"_id" : productId }, { $push: { 
        variations: [variation],
    }}, function(err, product){
            if(err){
                console.log(err);
            } else {
                res.redirect("/admin/inventory/"+productId+"/add-new-variation")
            }
        });
   }


    
   
    
});


module.exports = router;
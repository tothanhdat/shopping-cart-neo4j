const route = require('express').Router();
// const { uploadMulter } = require('../utils/config_multer');
const uuidv5 = require('uuid/v5');
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
const fs = require('fs');
const CUSTOMER_MODEL = require('../models/customer');
const ORDER_MODEL = require('../models/order')
const PRODUCT_MODEL         = require('../models/product');
const ROLE_ADMIN            = require('../utils/checkRole');
const CATEGORY_MODEL        = require('../models/category');
const { uploadMulter }      = require('../utils/config_multer');
const { sign, verify } = require('../utils/jwt')
//=============================public=========================
route.get('/single-product/:idProduct', async(req, res)=>{
    let  id = req.params;
    let { token } = req.session;
    
    let  idCustomer = '';
    let email = '';
    console.log(id)
    console.log('====================++++++++++++++')
    if(token){
        let checkRole = await verify(token);
        idCustomer = checkRole.data.id;
        email      =  checkRole.data.name;
        let dataFind =  await PRODUCT_MODEL.findByID(id.idProduct);
        if(dataFind.error) return res.render('404');
        let infoOder                        = await ORDER_MODEL.findByIdCustomer(idCustomer);
        console.log(infoOder);
        if(infoOder.error){
            return res.render('shop/single-product', {  product: dataFind.data._fields[0].properties, category :  dataFind.data._fields[1].properties,
                id : idCustomer,
                email : email,
                listOrder    : [] 
                });
        }
            return res.render('shop/single-product', { 
                product: dataFind.data._fields[0].properties,
                category :  dataFind.data._fields[1].properties,
                email : email, 
                id : idCustomer,
                listOrder : infoOder.data
            });
    }
    let dataFind =  await PRODUCT_MODEL.findByID(id.idProduct);
    console.log(dataFind);
    if(dataFind.error) return res.render('404');
    return res.render('shop/single-product', { product: dataFind.data._fields[0].properties, category :  dataFind.data._fields[1].properties,
    id : idCustomer,
    email : email,
    listOrder    : [] });
});

route.post('/search', async(req, res)=>{
    let { nameProduct } = req.body;
    let listProduct = await PRODUCT_MODEL.findWithCategory(nameProduct)
    if(!listProduct) return res.json({ error : true, message:'cant_create_product' });
    return res.json({ error: false, message : 'success', data: listProduct})
});


route.post('/find/:id_product', async(req, res)=>{
    let { id_product } = req.params;
    let listProduct = await PRODUCT_MODEL.findByID(id_product);
    if(!listProduct) return res.json({ error : true, message:'cant_create_product' });
    return res.json({ error: false, message : 'success', data: listProduct})
});

route.post('/search-with-orders', async(req, res)=>{
    let { nameCustomer }    = req.body;
    let listProduct      = await PRODUCT_MODEL.findWithOrder(nameCustomer);
    if(!listProduct) return res.json({ error : true, message:'cant_create_product' });
    return res.json({ error: false, message : 'success', data: listProduct})
});
//===============================ADMIN================================
route.get('/list',ROLE_ADMIN, async (req, res) => {
    let listProducts = await PRODUCT_MODEL.findAll();
    if(listProducts.error) return res.json({ error: true, message:'cant_get_list_products'});
    res.render('dashboard/pages/list-product-detail',{ data : listProducts.data });
});

route.post('/new-product',ROLE_ADMIN, uploadMulter.single('avatar'), async(req, res) =>{
    let { productName, category, amout, price }  = req.body;  
    let infoFile                                 = req.file;
    let idProduct                                = uuidv5(productName, MY_NAMESPACE);
    let image                                    = `/img/products/${infoFile.originalname}`;
    if(productName&&amout){
        let haDInsertProduct = await PRODUCT_MODEL.insert(idProduct, productName, category, image, Number(amout), Number(price));
        if(haDInsertProduct.error)  return res.json({ error : true, message:haDInsertProduct.message });
        return res.json({ error : false, message:'cant_create_product' });
    }
    return res.json({ error : true, message:'cant_create_product' });
});

route.get('/new-product',ROLE_ADMIN, async(req, res) =>{
    let listCategory = await CATEGORY_MODEL.findAll();
    console.log(listCategory)
    if(listCategory.error) return res.json({ error: false});
    return res.render('dashboard/pages/add-product', { data : listCategory.data });
});

route.post('/all-products', async(req, res)=>{
    let listProducts = await PRODUCT_MODEL.findAll();
    if(listProducts.error) return res.json({ error: true, message:'cant_get_list_products'});
    res.json({error: false, data : listProducts.data});
});

route.post('/find-rela', async(req, res)=>{
    let dataFind =  await PRODUCT_MODEL.findRelationship();
    console.log(dataFind);
    return res.json(dataFind);
});

route.post('/watchs/:name', async(req, res)=>{
    let  nameProduct  = req.params.name;
    console.log(nameProduct);
    let listProducts = await PRODUCT_MODEL.findWithCategory(nameProduct);
   
    if(listProducts.error) return res.json({data:'', message :  listProducts.message });
    return res.json(listProducts);
});

route.post('/forcus', async(req, res)=>{
    let { idProduct, idCustomer, time } = req.body;
    console.log( { idProduct, idCustomer, time });
    let listProduct = await PRODUCT_MODEL.makeRealtionForcus(idProduct, idCustomer, time);
    console.log(listProduct);
    if(!listProduct) return res.json({ error : true, message:'cant_create_product' });
    return res.json({ error: false, message : 'success', data: listProduct})
});


route.post('/age', async(req, res)=>{
    let listProduct = await PRODUCT_MODEL.findWithSexAndOld();
    console.log(listProduct.data.records[0]);
    if(!listProduct) return res.json({ error : true, message:'cant_create_product' });
    return res.json({ error: false, message : 'success', data: listProduct})
});


route.post('/delete/:id', async(req, res)=>{
    let idProduct = req.params;
    console.log({idProduct})
    let idDelete  = await PRODUCT_MODEL.deleteByID(idProduct.id);
    console.log(idDelete);
    if(idDelete.error)  return res.json({message :'cant_delete'});
    return res.json({ message : 'delete_success' });
});

route.get('/update/:id', async(req, res)=>{
    let idProduct = req.params;
    let inforProduct  = await PRODUCT_MODEL.findByID(idProduct.id);
    console.log(inforProduct)
    if(!inforProduct) return res.render('404');
    return res.render('dashboard/pages/update-product',{product : inforProduct.data._fields[0], category :inforProduct.data._fields[1] });
});
route.post('/update', uploadMulter.single('avatar'),async(req, res)=>{
    let { id, productName, category, amout, price,imagelink }  = req.body;  
    let infoFile                                 = req.file;
    if(infoFile){
        imagelink                                    = `/img/products/${infoFile.originalname}`;
    }
    let isUddate = await PRODUCT_MODEL.update(id, productName, amout, price, imagelink);
    if(isUddate.error){
        return res.json({message : 'cant_update'});
    }
    return res.json({ message : 'update_success'});
});

route.post('/find-with-categorys/', async(req, res)=>{
    let { categoryID, skip } = req.body;
    console.log({ categoryID, skip })
    let listProduct = await PRODUCT_MODEL.findAllProducuctOneCategory(categoryID, Number(skip));
    if(listProduct.error) return res.json();
    return res.json(listProduct.data);
});

route.post('/find-price', async(req, res)=>{
    let { startPrice, endPrice } = req.body;
    let listProduct = await PRODUCT_MODEL.findWithPrice(Number(startPrice), Number(endPrice));
    if(listProduct.error) return res.json();
    return res.json(listProduct.data);
});

module.exports = route;
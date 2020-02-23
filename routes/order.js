const route = require('express').Router();
// const { uploadMulter } = require('../utils/config_multer');
const fs = require('fs');
const ORDER_MODEL = require('../models/order');
const CUSTOMER_MODEL = require('../models/customer');
const uuidv5 = require('uuid/v5');
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
const ROLE_ADMIN = require('../utils/checkRole');



route.get('/list', ROLE_ADMIN, async (req, res) => {
    let listOrders = await ORDER_MODEL.findAll();
    if(listOrders.error) return res.json({ error: true, message:'cant_get_list_products'});
    res.render('dashboard/pages/list-orders',{ data : listOrders.data });
});

route.post('/new-orderline', async(req, res) =>{
    let { categoryName } = req.body; 

    if(categoryName){
        let haDInsertCategory = await CATEGORY_MODEL.insert(categoryName);
        if(!haDInsertCategory) return res.json({ error : true, message:'cant_create_category' });
        return res.json({ error: false, message : 'create_success'})
    }

    return res.json({ error : true, message:'cant_create_category' });
    
});


route.post('/update', async(req, res) =>{
    let { idCustomer, idProduct, amout } = req.body; 

    
    
});

route.post('/new', async(req, res) =>{
    let { idCustomer, listProduct, timeOrder, addressShip } = req.body; 
    console.log('==========new order')
    addressShip = '';
    console.log({idCustomer, listProduct, timeOrder, addressShip});
    let status = 0;
    let totalPrice = 2000;
    if(idCustomer ){
        let id = uuidv5(timeOrder, MY_NAMESPACE);
        let haDInsertOrder = await ORDER_MODEL.insert(id, idCustomer, listProduct, timeOrder, addressShip, totalPrice, status);
        if(!haDInsertOrder) return res.json({ error : true, message: haDInsertOrder.message });
        return res.json({ error: false, message: haDInsertOrder.message })
    }
    return res.json({ error : true, message:'cant_create_order' });
    
});


module.exports = route;
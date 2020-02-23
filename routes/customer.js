const express = require('express');
const route = require('express').Router();
const uuidv5 = require('uuid/v5');
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
const ROLE_ADMIN = require('../utils/checkRole');
const { sign, verify } = require('../utils/jwt');
// const { uploadMulter } = require('../utils/config_multer');
const fs = require('fs');
const CUSTOMER_MODEL = require('../models/customer');
const PRODUCT_MODEL = require('../models/product');
const ORDER_MODEL = require('../models/order');
const CATEGORY_MODEL = require('../models/category');
const _lodash = require('lodash');

route.use(express.static('./public'));

route.get('/', async (req, res) => {
    let listProducts = await PRODUCT_MODEL.findLimitSkip(10, 0);
    let { token } = req.session;
    let idCustomer = null;
    let email = '';
    let listProductsRecomendation = { data: [] };
    if (token) {
        let checkRole = await verify(token);
        idCustomer = checkRole.data.id;
        email = checkRole.data.name;
        let infoCustomer = await CUSTOMER_MODEL.findById(idCustomer);
        let listProductsRecomendation = await PRODUCT_MODEL.findWithOrder(infoCustomer.data.phone);
        let infoOder = await ORDER_MODEL.findByIdCustomer(idCustomer);
        if (listProductsRecomendation.error || listProductsRecomendation.data.length == 0) {
            listProductsRecomendation = await PRODUCT_MODEL.findWithSexAndOld(infoCustomer.phone);
        }
        if (infoOder.error) {
            return res.render('pages/home', {
                listData: listProducts.data,
                email: email,
                id: idCustomer,
                listProductsRecomendation: listProductsRecomendation.data,
                listOrder: []
            });
        }

        if (listProducts.error) res.render('404');
        return res.render('pages/home', {
            listData: listProducts.data,
            email: email,
            id: idCustomer,
            listProductsRecomendation: listProductsRecomendation.data,
            listOrder: infoOder.data,
            _lodash
        });
    }
    // console.log({ listProducts });
    return res.render('pages/home', {
        listData: listProducts.data,
        email: email,
        id: idCustomer,
        listProductsRecomendation: [],
        listOrder: []
    });
})
route.get('/login', function (req, res) {
    return res.render('pages/login');
});

route.post('/login', async (req, res) => {
    let { phoneNumber, password } = req.body;
    let checkLogin = await CUSTOMER_MODEL.signIn(phoneNumber, password);
    if (checkLogin.error) res.json({ error: true, message: ' phone or password  was been wrong! ' });
    req.session.token = checkLogin.data.token;
    let listProducts = await PRODUCT_MODEL.findLimitSkip(10, 0);
    let listProductsRecomendation = await PRODUCT_MODEL.findWithOrder(phoneNumber);
    let infoOder = await ORDER_MODEL.findByIdCustomer(checkLogin.data.infoUSer.records[0]._fields[0].properties.id);
    console.log('================================login');
    console.log(infoOder)
    if (listProductsRecomendation.error || listProductsRecomendation.data.length == 0) {
        console.log('jion ==')
        listProductsRecomendation = await PRODUCT_MODEL.findWithSexAndOld(phoneNumber);
        console.log(listProductsRecomendation.data)
    }
    if (infoOder.error) {
        console.log(' no order ')
        return res.redirect('/', {
            listData: listProducts.data,
            email: checkLogin.data.infoUSer.records[0]._fields[0].properties.name,
            id: checkLogin.data.infoUSer.records[0]._fields[0].properties.id,
            listProductsRecomendation: listProductsRecomendation.data,
            listOrder: []
        });
    }
    console.log('==order ?????')
    console.log(infoOder)
    console.log(infoOder.data)
    if (listProducts.error) res.render('404');
    return res.render('pages/home', {
        listData: listProducts.data,
        email: checkLogin.data.infoUSer.records[0]._fields[0].properties.name,
        id: checkLogin.data.infoUSer.records[0]._fields[0].properties.id,
        listProductsRecomendation: listProductsRecomendation.data,
        listOrder: infoOder.data
    });

})

route.get('/register', function (req, res) {
    return res.render('pages/register');
});

route.get('/checkout', async (req, res) => {
    let listProducts = await PRODUCT_MODEL.findLimitSkip(10, 0);
    let { token } = req.session;
    let idCustomer = '';
    let email = '';
    let listProductsRecomendation = { data: [] };
    if (token) {
        let checkRole = await verify(token);
        idCustomer = checkRole.data.id;
        email = checkRole.data.name;
        let infoCustomer = await CUSTOMER_MODEL.findById(idCustomer);
        let listProductsRecomendation = await PRODUCT_MODEL.findWithOrder(infoCustomer.data.phone);
        let infoOder = await ORDER_MODEL.findByIdCustomer(idCustomer);
        if (listProductsRecomendation.error || listProductsRecomendation.data.length == 0) {
            listProductsRecomendation = await PRODUCT_MODEL.findWithSexAndOld(infoCustomer.phone);
        }
        if (infoOder.error) {
            return res.render('shop/checkout', {
                listData: listProducts.data,
                email: email,
                id: idCustomer,
                listProductsRecomendation: listProductsRecomendation.data,
                listOrder: []
            });
        }

        if (listProducts.error) res.render('404');
        return res.render('shop/checkout', {
            listData: listProducts.data,
            email: email,
            id: idCustomer,
            listProductsRecomendation: listProductsRecomendation.data,
            listOrder: infoOder.data
        });
    }
    return res.render('shop/checkout', {
        listData: listProducts.data,
        email: email,
        id: idCustomer,
        listProductsRecomendation: listProductsRecomendation.data,
        listOrder: []
    });
});



route.get('/list', ROLE_ADMIN, async (req, res) => {
    let listProducts = await PRODUCT_MODEL.findLimitSkip(10, 0);
    if (listCustomer.error) return res.json({ error: true, message: 'cant_get_list_products' });
    res.render('dashboard/pages/list-customers', { data: listCustomer.data });
});
route.get('/list-products', async (req, res) => {
    let listProducts = await PRODUCT_MODEL.findLimitSkip(10, 0);
    console.log(listProducts)

    let { token } = req.session;
    let idCustomer = '';
    let email = '';
    let listCategorys = await CATEGORY_MODEL.findAll();
    if (token) {
        let checkRole = await verify(token);
        idCustomer = checkRole.data.id;
        email = checkRole.data.name;
        infoOder = await ORDER_MODEL.findByIdCustomer(idCustomer);
        return res.render('shop/shop', {
            data: listProducts.data,
            listCategorys: listCategorys.data,
            email: email,
            id: idCustomer,
            listOrder: infoOder.data
        });
    }
    if (listProducts.error) return res.json({ error: true, message: 'cant_get_list_products' });
    return res.render('shop/shop', {
        data: listProducts.data,
        listCategorys: listCategorys.data,
        email: email,
        id: idCustomer,
        listOrder: []
    });
});
route.post('/new-customer', async (req, res) => {
    let { phoneNumber, email, password, sex } = req.body;
    if (phoneNumber) {
        let id = uuidv5(phoneNumber, MY_NAMESPACE)
        console.log(id);
        let hadInsertCategory = await CUSTOMER_MODEL.insert(id.toString(), phoneNumber, email, password, sex);
        if (!hadInsertCategory) return res.json({ error: true, message: hadInsertCategory.message });
        return res.json({ error: false, message: hadInsertCategory.message })
    }
    return res.json({ error: true, message: 'cant_create_customer' });
});

route.get('/all-customer', async (req, res) => {
    let listCustomer = await CUSTOMER_MODEL.findAll();
    if (listCustomer.error) return res.json({ error: true, message: listCustomer.message });
    res.json({ error: false, data: listCustomer.data });
})

module.exports = route;
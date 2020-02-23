const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ProductSchema = new Schema({
    nameProduct: String,
    idProduct: String,
    idCategory: String,
    avatar: String,
    price: String
});
var ProductModel = mongoose.model('product', ProductSchema);
module.exports = ProductModel;
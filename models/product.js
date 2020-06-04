const { driver } = require('../config/cf_db')
var session = driver.session();

module.exports = class Products {
    // Thêm sản phẩm
    static insert(idProduct, productName, categoryName, image, amout, price) {
        return new Promise(async resolve => {
            try {
                let queryCategory = `MATCH (n:Categorys) WHERE n.name = $categoryName RETURN n `;
                let queryCreateProduct = 'CREATE (a:Products {id: $idProduct, name: $productName, image : $image, amout : $amout, price : $price } ) RETURN a';
                let queryReShipProductCategory =   'MATCH (product:Products { name: $productName }),(category:Categorys { name:$categoryName}) CREATE (product)-[:INSIDE ]->(category)';
                let queryHadProduct = `MATCH (n:Products) WHERE n.name = $productName RETURN n `;
               
                //kiem tra san pham trung ten
                const hadProduct = await session.run(queryHadProduct, { productName: productName });
                if(hadProduct.records.length) return resolve({ error: true, message:'product_had_been' });
                
                //kiem tra da co loai chua
                const hadCategory = await session.run(queryCategory, { categoryName: categoryName });
                console.log(categoryName);
                if(!hadCategory.records.length) return resolve({ error: true, message: 'cant_create_product_no_category' });
                //tao san pham
                const newProduct = await session.run(
                    queryCreateProduct,{
                        idProduct   : idProduct, 
                        productName : productName,
                        image       : image, 
                        amout       : amout,
                        price       : price
                });
                if(!newProduct.records.length) return resolve({ error: true, message:'cant_create_product'});
                //tao lien ket giua san pham va loai san pham
                const relationshipWithCategory = await session.run(
                    queryReShipProductCategory
                    ,{
                        productName     : productName,
                        categoryName    : categoryName
                    }
                );
                if(relationshipWithCategory.records.length <0) return resolve({ error: false, message: 'product_no_category' });

                return resolve({ error: false, message: 'create_product_success' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }
    // Tất cả sản phẩm
    static findAll(){
        return new Promise(async resolve => {
            let query = `MATCH (n:Products) RETURN n `;
            const listProducts = await session.run(query);
            if(!listProducts.records) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, data: listProducts.records });
        })
    }
  
    // tìm những sản phẩm đã order
    static findWithOrder(phone){
        return new Promise(async resolve => {
            try {
                console.log(phone)
              let queryText = `
              MATCH (:Customers { phone: $phone })<-[:OF]-(order : Orders)
              MATCH (:Orders { id: order.id})-->(product : Products)
              MATCH(:Products {name : product.name})-->(category:Categorys)
              MATCH(:Categorys{name : category.name})<-[:INSIDE]-(resultProduct : Products)
              return resultProduct,  COUNT(resultProduct.name) as productnumber, category.name
              ORDER BY productnumber DESC`;
                if(!phone) return resolve({ error: true, message :'cant_get_more_products'});
                const listProduct = await session.run(
                    queryText
                    ,{
                        phone : phone,
                    }
                );
               
                if(!listProduct) return resolve({ error: true, message :'cant_get_list_roduct', data :[]});
                return resolve({ error: false, message:'success', data : listProduct.records });
            }catch (error) {
                return resolve({ error: true, message: error.message ,  data :[]});
            }
        });
    }
    // sản phẩm dcd khach xem nhiều nhất
    static watchAlot(){
        return new Promise(async resolve =>{
            try {
                let queryCustomerWithProduct    = 'MATCH (product:Products { name: $productName }),(customer:Customers { id:$idCustomer }) CREATE (customer)-[:CARE ]->(product)';
                //make relationship customer with products
                
            } catch (error) {
                return resolve({error : true, message :'cant_add_relationship'});
            }
        })
    }
    // tạo mối quan hệ giữ 2 sản phẩm
    // vi dụ: mua A tặng kèm B
    // mua A gảm giá B
    // dựa vào chiến dịch của cưa hàng
    static makeRealtionshipProducts(){
        return new Promise(async resolve =>{
            try {
                let query = `MATCH (productA:Products{ name : $productNameA }), (productB:Products{ name : $productNameB }) 
                CREATE productA -[$relationship]-> productB
                RETURN `;
                return resolve({ error: false, message:'make_relationship_success' });
            } catch (error) {
                return resolve({ error : true, message : 'cant_make_relationship' });
            }
        })
    }
    // xóa sản phẩm
    static deleteByID(idProduct){
        return new Promise(async resolve => {
            let query                = `MATCH (n:Products{id:$idProduct}) DETACH DELETE n`;
            const resultDelete       = await session.run(query, { idProduct: idProduct });
            console.log(resultDelete)
            if(!resultDelete) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, message:'delete_order_success' });
        })
    }
    // tìm các mối quan hệ của sản phẩm
    static findRelationship(){
        return new Promise(async resolve=>{
            let query = `MATCH(Orders)-[r]->(Products)
            where r.HAVE > 0
             RETURN Products`;
            let resultFind = await session.run(
                query
            );
            
            // console.log(resultFind.records);
            return resolve({ error : false, message : 'find success', data : resultFind.records });
        })
    }
    // tìm những sản phầm khách đã xem
    static findWithRForCus(phoneNumber){
        return new Promise(async resolve =>{
            let queryMaxRForcus =   `MATCH (:Customers { phone: $phoneNumber })-[r:FORCUS]->( Products)
            return   max(r.WATCH)`
            let maxForcus = await session.run(
                queryMaxRForcus,
                {phoneNumber : phoneNumber}
            );
            console.log(maxForcus.records[0]._fields[0])
            let maxR = maxForcus.records[0]._fields[0];
            if(maxR){
                let queryProductWithRForcus = `MATCH (:Customers { phone: $phoneNumber })-[r:FORCUS]->( Products)
                where r.WATCH = ${maxR}
                return  Products
                LIMIT 5`
                let maxForcus = await session.run(
                    queryProductWithRForcus,
                    {phoneNumber : phoneNumber}
                );
                console.log({maxForcus})
                return resolve({ error : false, message :'get_success', data :  maxForcus.records});
            }else{
                return resolve({ error : true, message :'get_fail', data :null});
            }
        })
      
    }
    // tìm những sản phẩm tương tự 
    static findWithCategory(nameProduct){
        return new Promise(async resolve =>{
            nameProduct = nameProduct.trim()
            let query = `MATCH(:Products {name : $nameProduct })-->(category:Categorys)
            MATCH(:Categorys {name : category.name})<--(products :Products)
            RETURN products LIMIT 7`;
            let listProducts = await session.run(
                query,
                { nameProduct : nameProduct }
            );
            if(!listProducts) return resolve({ error: true, message : 'fail' });
            return resolve({ error : false, message :'get_success', data : listProducts});
        });
    }
    // danh sachsanr phẩm phân trang
    static findLimitSkip(limit, skip){
        return new Promise(async resolve => {
            let query = `MATCH (n:Products) RETURN n 
                        SKIP $skipN
                        LIMIT  $limitN  `;
            const listProducts = await session.run(query,
                {
                    limitN : limit,
                    skipN : skip
                });

                console.log(listProducts)
            if(!listProducts.records) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, data: listProducts.records });
        })
    }
    // tìm tất cả sản phẩm của 1 danh mục
    static findAllProducuctOneCategory(categoryID, skip){
        return new Promise(async resolve =>{
            let query = `
            MATCH(:Categorys {id : $categoryID})<--(products :Products)
            RETURN products
            SKIP $skipN
            LIMIT 7  
            ` ;
            let listProducts = await session.run(
                query,
                { categoryID : categoryID ,
                    skipN : skip}
            );
            if(!listProducts) return resolve({ error: true, message : 'fail' });
            return resolve({ error : false, message :'get_success', data : listProducts.records});
        });
    }
    // tìm sản phẩm theo tuổi và giới tinh
    static findWithSexAndOld(phone){
        return new Promise(async resolve => {
            try {
                let query = `MATCH (cus:Customers { phone:$phone })
                MATCH (category:Categorys { maleMajority:cus.male })
                MATCH(:Categorys {name : category.name})<--(products :Products)
                RETURN products`;
                const listCustomers = await session.run(query,
                    {phone : phone});
                if(!listCustomers) return   resolve({ error: true,message :'fail', data: [] });
                return resolve({ error: false,message:'get success', data: listCustomers.records });
         
            } catch (error) {
                return   resolve({ error: true,message :error, data: [] });
            }
          
        })
    }
    // lấy thông tin sản phẩmtheoID
    static findByID(idProduct){
        return new Promise(async resolve => {
            if(idProduct){  
                let query                = `MATCH(p:Products {id:$idProduct})-->(c:Categorys)
                RETURN  p,c`;
                const resultFind      = await session.run(query, 
                    { idProduct: idProduct.trim() });
                if(resultFind.records.length <1 ) return resolve({ error: true, message: 'cant_get_product'})
                return resolve({ error: false, message:'get_success', data : resultFind.records[0] });
            }
            return resolve({ error: true, message: 'cant_get_product'});
        })
    }
    // tìm sản phẩm theo giá
    static findWithPrice(startPrice, endPrice){
        return new Promise(async resolve => {
            if(startPrice, endPrice){  
                let query                = `MATCH(p:Products) where p.price >$startPrice  and p.price <$endPrice
                RETURN  p`;
                const resultFind      = await session.run(query, 
                    { 
                        startPrice: startPrice,
                        endPrice: endPrice
                     });
                if(resultFind.records.length <1 ) return resolve({ error: true, message: 'cant_get_product'})
                return resolve({ error: false, message:'get_success', data : resultFind.records });
            }
            return resolve({ error: true, message: 'cant_get_product'});
        })
    }
    // chỉnh sưa thoogn tin sản phẩm
    static update(idProduct, nameProducts, amout, price, image){
        return new Promise(async resolve => {
           
            let query                = `MATCH (Products { id: $idProduct })
            SET Products.amout = $amout , Products.name = $nameProducts, Products.image = $image, 
            Products.price = $price
            RETURN Products`;
            const resultUpdate      = await session.run(query, 
                { 
                idProduct        : idProduct,
                amout            :amout,
                nameProducts     : nameProducts,
                price            : price,
                image            : image });
            if(!resultUpdate) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, message:'update_order_success' });
        })
    }
    // tìm những sản phẩm được mua nhiều nhất // giới hạn 10
    static findBestSell(){
        return new Promise(async resolve => {
            let query                = `MATCH (Orders)-[:HAVE]->(P: Products)
            Return P
            LIMIT 10`;
            const listProducts      = await session.run(query);
            if(!listProducts) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, message:'update_order_success', data : listProducts.records });
        })
    }
    // tạ mối quan hệ  "đã xme sản phẩm "  cho khách hàng với sản phẩm
    static makeRealtionForcus (idProduct, idCustomer, time){
        return new Promise(async resolve => {

            let queryRe = `MATCH (:Customers { id: $idCustomer })-[r]->(Products { id: $idProduct })
            RETURN r`;
              let resultFind = await session.run(
                queryRe,
                { idCustomer : idCustomer, idProduct : idProduct }
            );
              console.log(resultFind.records.length);
            if(resultFind.records.length >0){
                console.log('============================join=============================');
                let newWatch =  Number(resultFind.records[0]._fields[0].properties.WATCH) + Number(time);
                console.log(resultFind.records[0]._fields[0].properties.WATCH);
                let queryUpdate = `MATCH (:Customers { id: $idCustomer })-[r]->(Products { id: $idProduct })
                SET r.WATCH = $newWatch
                RETURN Products`;
                let resultUpdateRe      = await session.run(queryUpdate, 
                    { 
                        idProduct   : idProduct,
                        idCustomer  : idCustomer,
                        newWatch    : newWatch
                    });
                if(!resultUpdateRe) return resolve({ error: true, message: 'cant_get_product'})
                return resolve({ error: false, message:'update_relation_customer_Product_success' });
            }
            let query = `MATCH (Customers { id: $idCustomer }),(Products { id: $idProduct })
                        CREATE (Customers)-[r:FORCUS { WATCH : $time }]->(Products)
                        RETURN Products`;
            let resultMakeRe      = await session.run(query, 
                { 
                    idProduct: idProduct,
                    idCustomer: idCustomer,
                    time: time
                });
            if(!resultMakeRe) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, message:'update_order_success' });
        })
    }

    // tìm sản phẩm có độ ảnh hưởng nhiều nhất ( được xem nhiều , mua nhiều)
    static getListProductTop (){
        return new Promise(async resolve => {
            let query                = 
            `
            CALL algo.pageRank.stream('Products', '', { iterations:20, dampingFactor:0.85 })
            YIELD nodeId, score
            RETURN  algo.asNode(nodeId).name AS name, score
            ORDER BY score DESC`;
            let listProduct      = await session.run(query);
            if(!listProduct)
                return resolve({ error: true, message:'get_product_fail' });

            return resolve({ error: false, data : listProduct });

        })
    }

    /*
    `
    CALL algo.pageRank.stream('Products', 'IS_FRIENDS', {iterations:20, dampingFactor:0.85, weightProperty: "forcus"})
    YIELD nodeId, score
    RETURN algo.asNode(nodeId)._id AS _id, algo.asNode(nodeId).name AS name, score
    ORDER BY score DESC`;*/


}
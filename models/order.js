const neo4j = require('neo4j-driver');
var uri = 'https://hobby-aaoahnggdnbngbkenbccnmdl.dbs.graphenedb.com:24780/db/data/';

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('Dat', '123456'));
var session = driver.session();

module.exports = class Orders {
    static queryCypher(stringQuery, data) {
        const promisResult =  session.run(
            stringQuery
            ,data
        );
        return promisResult;
    };

    static insert(idOrder, idCustomer, listProduct, timeOrder, addressShip, totalPrice, status) {
        return new Promise(async resolve => {
            try {
                let queryNewOrder               = 'CREATE (a:Orders { id:$id, idCustomer : $idCustomer, idProduct : $listProduct, timeOrder: $timeOrder, addressShip : $ addressShip, totalPrice : $totalPrice, status : $status }) RETURN a'
                let queryProductWithOrders      = 'MATCH (product:Products { id: $productId }),(order:Orders { id:$id}) CREATE (order)-[r:HAVE { HAVE : $amout }]->(product)';
                let queryCustomerWithProduct    = 'MATCH (product:Products { id: $productId }),(customer:Customers { id:$idCustomer }) CREATE (customer)-[r:RELTYPE {BUY : $amout} ]->(product)';
                let queryCustomerWithOrders     = 'MATCH (customer:Customers { id:$idCustomer  }),(order:Orders { id:$id}) CREATE (order)-[:OF ]->(customer)'
                let queryCheckReShipCustomerProducts = `MATCH (:Customers{id :$idCustomer })-[r]->(:Products { id: $productId })
                RETURN r`;

                let newListProduct = [];
                listProduct.forEach(product => {
                        newListProduct.push(product.id);
                });
                const newOrder = await session.run(
                    queryNewOrder
                    ,{
                        id          : idOrder,
                        idCustomer  : idCustomer,
                        listProduct : newListProduct,
                        timeOrder   : timeOrder,
                        addressShip : addressShip,
                        totalPrice  : totalPrice,
                        status : status
                    })
                if(!newOrder.records.length) return resolve({ error: true, message :' cant_create_order'});
                    //customer with order
                    const relationshipCustomerWithOrder = await session.run(
                        queryCustomerWithOrders,
                        {
                            idCustomer  : idCustomer,
                            id          : idOrder
                        });
                 (async ()=> {
                    for (const product of listProduct) {
                        let productId = product.id;
                        let amout = Number(product.amout);
                            console.log({productId});
                    
                        
                        
                        if(!relationshipCustomerWithOrder) return resolve({ error:true, message :'cant_make_customer_product' });
                        //customer with product
                        const IsrelationshipCustomerWithProduct   = await session.run(
                            queryCheckReShipCustomerProducts,
                            {
                                idCustomer : idCustomer,
                                productId : productId
                            }
                        )
                        const makeRelationshipCustomerWithProduct = await session.run(
                            queryCustomerWithProduct,
                            {
                                productId : productId,
                                idCustomer  : idCustomer,
                                amout       : amout

                            });
                        if(!makeRelationshipCustomerWithProduct) return resolve({ error:true, message :'cant_make_customer_product' });
                        //Product with order  => orderLine
                        const relationshipOrderWithProduct = await session.run(
                            queryProductWithOrders
                            ,{
                                productId : productId,
                                id          : idOrder,
                                amout     : amout
                            });
                        if(!relationshipOrderWithProduct) return resolve({ error: true, message:'cant_make_relationship' });
                      
                    }
                  })()
                  return resolve({ error: false, message:'true' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }   


    static findAll(){
        return new Promise(async resolve => {
            let query              = `MATCH (n:Orders) RETURN n `;
            const listOrders       = await session.run(query);
            if(!listOrders.records) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, data: listOrders.records });
        })
    }

    static update(idCustomer, idProduct, amout){
        return new Promise(async resolve => {
            let query              = `MATCH (n:Orders{ Orders.idCutomer = $idCustomer}) RETURN n `;
            const infoOrders       = await session.run(query,
                {idCustomer : idCustomer});
            if(!infoOrders.records.length > 0){
                console.log('have order')
            }
            let queryNewOrder = `MATCH ()`
        })
    }
    
    static delete(idOrder){
        return new Promise(async resolve => {
            let query                = `MATCH (n:Orders{id:%idOrder}) DETACH DELETE n`;
            const resultDelete       = await session.run(query, { idOrder: idOrder });
            if(!resultDelete) return resolve({ error: true, message: 'cant_get_order'})
            return resolve({ error: false, message:'delete_order_success' });
        })
    }

    static findByIdCustomer(idCustomer){
        return new Promise(async resolve => {
            let query              = `MATCH (order:Orders{idCustomer : $idCustomer})	
                 					MATCH (:Orders { id: order.id})-[r]->(product : Products)	
                                    RETURN product, r, order `;
            const listOrders       = await session.run(query, { idCustomer: idCustomer });
            if(listOrders.records.length == 0   ) return resolve({ error: true, message: 'cant_get_product', data : []})
            return resolve({ error: false, data: listOrders.records });
        })
    }

}
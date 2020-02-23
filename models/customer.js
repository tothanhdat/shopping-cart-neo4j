const neo4j = require('neo4j-driver');
const { hash, compare } = require('bcrypt');
const { sign, verify } = require('../utils/jwt');
var uri = 'https://hobby-aaoahnggdnbngbkenbccnmdl.dbs.graphenedb.com:24780/db/data/';

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('Dat', '123456'));
var session = driver.session();


module.exports = class Customers {
    static insert(customerId, phoneNumber, password, email, sex) {
        return new Promise(async resolve => {
            try {
                // console.log({sex})
                let role = 0;
                if(sex =='nam'){
                    sex = '1';
                }else{
                    if(sex =='nữ'){
                        sex = '0';
                    }else{
                        sex = '2';
                    }
                }
                let queryCheckCustomer = `MATCH (Customers { phone: $phoneNumber })
                RETURN Customers`;
                const checkExist = await session.run(
                    queryCheckCustomer
                    ,{
                        phoneNumber     : phoneNumber,
                    }
                  );
                if (checkExist.records.length!=0 )
                    return resolve({ error: true, message: 'phone_existed' });
                let hashPassword = await hash(password, 8);
                console.log(typeof(customerId));
                let queryNewCustomer = 'CREATE (a:Customers { id : $customerId, email: $email, phone : $phoneNumber, password :$hashPassword, male : $sex, role :$role }) RETURN a';
                const newCustomer = await session.run(
                    queryNewCustomer
                    ,{
                        customerId      : customerId,
                        phoneNumber     : phoneNumber,
                        email           : email,
                        sex             : sex,
                        hashPassword    : hashPassword,
                        role            : role
                    }
                  );
                if(!newCustomer.records.length) return resolve({ error: true, message: 'cant_insert_customer' });
                return resolve({ error: false, message: 'create_susscess' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    static signIn(phoneNumber, password) {
        return new Promise(async resolve => {
            try {
                let queryCheckCustomer = `MATCH (Customers { phone: $phoneNumber })
                RETURN Customers`;
                const infoUSer = await session.run(
                    queryCheckCustomer
                    ,{
                        phoneNumber     : phoneNumber,
                    }
                  );
                if (infoUSer.records.length == 0 )
                    return resolve({ error: true, message: 'phone_existed' });
                const checkPass = await compare(password, infoUSer.records[0]._fields[0].properties.password);
                if (!checkPass)
                    return resolve({ error: true, message: 'password_not_exist' });
                await delete infoUSer.password;
                let token = await sign({ data: infoUSer.records[0]._fields[0].properties });
                return resolve({ error: false, data: { infoUSer, token } });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    static findAll(){
        return new Promise(async resolve => {
            let query = `MATCH (n:Customers) RETURN n `;
            const listCustomers = await session.run(query);
            if(!listCustomers.records) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, data: listCustomers.records });
        })
    }

    static findByPhone(){
        return new Promise(async resolve => {
            let query = `MATCH (n:Customers) RETURN n `;
            const listCustomers = await session.run(query);
            if(!listCustomers.records) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, data: listCustomers.records });
        })
    }
    
    static findById(idCutomer){
        return new Promise(async resolve => {
            let query = `MATCH (n:Customers{id :$idCutomer}) RETURN n `;
            const listCustomers   = await session.run(query,
                {idCutomer:idCutomer});
            if(!listCustomers.records&&listCustomers.records.length ==0) return resolve({ error: true, message: 'cant_get_customer'});
            return resolve({ error: false, data: listCustomers.records[0]._fields[0].properties || null  });
        })
    }
    static delete(idCustomer){
        return new Promise(async resolve => {
            let query                = `MATCH (n:Customers{id:%idCustomer}) DETACH DELETE n`;
            const resultDelete       = await session.run(query, { idCustomer: idCustomer });
            if(!resultDelete) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, message:'delete_order_success' });
        })
    }


}
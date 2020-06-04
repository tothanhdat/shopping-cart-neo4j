const neo4j = require('neo4j-driver');
var uri = 'https://hobby-aaoahnggdnbngbkenbccnmdl.dbs.graphenedb.com:24780/db/data/';

const { driver } = require('../config/db');
var session = driver.session();

module.exports = class Categorys {
    static insert(id, authorID, content, oldMajority, maleMajority) {
        return new Promise(async resolve => {
            try {
                    const resultPromise = await session.run(                    
                        'CREATE (a:Comments { id: $id, author : $authorID, content : $content }) RETURN a'
                        ,{
                            id              : id,
                            authorID        : authorID,
                            content         : content
                        }
                      );
                      console.log(resultPromise);
                    if(!resultPromise) return resolve({ error: true, message: 'cant_insert_comment' });
                    return resolve({ error: false, data: resultPromise });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    static findAllByProductID(){
        return new Promise(async resolve => {
            let query = `MATCH (n:Categorys) RETURN n `;
            const listCategory = await session.run(query);
            //console.log(listCategory.records);
            if(!listCategory.records) return resolve({ error: true, message: 'cant_get_category'})
            return resolve({ error: false, data: listCategory.records });
        })
    }
    static deleteById(idCategory){
        return new Promise(async resolve => {
            let query                = `MATCH (n:Categorys{id:$idCategory}) DETACH DELETE n`;
            const resultDelete       = await session.run(query, { idCategory: idCategory });
            if(!resultDelete) return resolve({ error: true, message: 'cant_get_category'})
            return resolve({ error: false, message:'delete_order_success' });
        })
    }
    static update( nameCategory, maleMajority, oldMajority, ){
        return new Promise(async resolve => {
            console.log(nameCategory)
            let query                   = `MATCH (Categorys { name: $nameCategory })
            SET
                 Categorys.oldMajority  = $oldMajority ,
                 Categorys.maleMajority = $maleMajority
            RETURN Categorys`;
            const resultUpdate      = await session.run(query, 
                {   nameCategory    : nameCategory,
                    maleMajority    : maleMajority,
                    oldMajority     : oldMajority });
            console.log(resultUpdate)
            if(!resultUpdate) return resolve({ error: true, message: 'cant_update_category'})
            return resolve({ error: false, message:'update_category_success' });
        })
    }
    
}
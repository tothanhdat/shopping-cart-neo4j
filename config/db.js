// DB Đạt
// const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('Dat', '123456'));
// DB Vinh
let neo4j = require('neo4j-driver');

let driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '01243823995'));



module.exports = {
    driver
}
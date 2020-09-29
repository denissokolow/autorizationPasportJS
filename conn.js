const m = require('mongoose');
m.set('debug', true);
async function getConn() {
    await m.connect('mongodb://newbie:123@84.38.180.19/newusers', { useNewUrlParser: true});
}
getConn().catch(e => console.error('Соединиться	с	БД	не	удалось.	На	этом	всё.'));
module.exports = m;
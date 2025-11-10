var util = require('util');
var ee = require('events');

var db_data = [
    {id: 1, name: 'Иванов и.и.', bday:'2001-01-01'},
    {id: 2, name: 'Петров П.П.', bday:'2001-01-02'},
    {id: 3, name: 'Сидоров С.С.', bday:'2001-01-03'}
]

function DB(){
    this.get = () => {return db_data;};
    this.post = (r) => {db_data.push(r);};
    this.put = (r) => {
        let index = db_data.findIndex(o => o.id === r.id);
        if(index === -1)
            return false
        db_data[index] = r;
        return true;
    }
    this.delete = (id) => {
        let index = db_data.findIndex(o => o.id === id);
        if(index === -1)
            return null;
        let r = db_data[index];
        db_data.splice(index, 1);
        return r;
    }
    this.commit = () => {
        console.log('Commited');
        return;
    }
}

util.inherits(DB, ee.EventEmitter);

exports.DB = DB;
const { TodoBook } = require('./list');
const fs = require('fs');

module.exports.write_file = function write_file(data) {
    data = JSON.stringify(data);
    const file_path = process.env.cfg || './todo.json';

    fs.writeFileSync(file_path, data, 'utf8', (err) => {
        console.log(`Err when writing file to ${file_path}`);
        process.exit(1);
    });
};

module.exports.read_file = function read_file() {
    let res = new TodoBook();
    const file_path = process.env.cfg || './todo.json';
    if (!fs.existsSync(file_path)) {
        return res;
    }

    const data = fs.readFileSync(file_path, 'utf-8');
    res.parse_from_obj(JSON.parse(data));
    return res;
};

const express = require('express');
const path = require('path');
const { finished } = require('stream');

const app = express();

const server = require('http').createServer(app);
const io = require('socket.io')(server);

const { read_file, write_file } = require('./file.js');
const { TodoItem, TodoList } = require('./list.js');
const { filter } = require('./filter.js');

let book = read_file();

console.log(JSON.parse(JSON.stringify(book)));

io.on('connection', socket => {
    let list_index = null;
    socket.on('look', name => {
        if (list_index != null) {
            socket.leave(book.list[list_index].name);
        }

        socket.join(name);

        for (let i in book.list) {
            if (book.list[i].name == name) {
                list_index = i;
                break;
            }
        }

        socket.emit('set', book.list[list_index]);
    });

    socket.on('edit', (index, new_val) => {
        if (list_index == null) {
            return;
        }

        new_val = filter(new_val);

        book.list[list_index].list[index] = new TodoItem(new_val.title, new_val.content, new_val.importance, new_val.finished);

        io.to(book.list[list_index].name).emit('set', book.list[list_index]);
        console.log(`[Edit] Item`);
        write_file(book);
    });

    socket.on('achieve_list', () => {
        if (list_index == null) {
            return;
        }

        book.list[list_index].finished = true;

        io.to(book.list[list_index].name).emit('set', book.list[list_index]);
        console.log(`[Achieve] List '${book.list[list_index].name}'`);
        write_file(book);
    });

    socket.on('add', new_val => {
        new_val = filter(new_val);

        book.list[list_index].list.push(new TodoItem(new_val.title, new_val.content, new_val.importance));

        io.to(book.list[list_index].name).emit('set', book.list[list_index]);
        console.log(`[Add] Item '${new_val.title}'`);
        write_file(book);
    });
});

app.get('/api/list', (req, res) => {
    res.send(book.list).end();
});

app.post('/api/list/:name', (req, res) => {
    req.params.name = req.params.name.substr(0, 50);

    book.list.push(new TodoList(req.params.name));
    res.status(204).end();
    console.log(`[New] List '${req.params.name}'`);
    write_file(book);
});

app.use(express.static(path.resolve(__dirname, '../frontend/dist')));

server.listen(3000, () => {
    console.log('Serving on port 3000');
});

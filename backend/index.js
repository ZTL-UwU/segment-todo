const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    maxHttpBufferSize: 32 * 1024,
});

const { TodoDatabase } = require('./database.js');
const { TodoItem, TodoList } = require('./list.js');
const { filter } = require('./filter.js');

const database = new TodoDatabase();
let book = database.load_book();
const MAX_LISTS = 1000;
const MAX_ITEMS_PER_LIST = 10000;

function room_name(list_id) {
    return `todo-list:${list_id}`;
}

function send_socket_error(socket, ack, code, message) {
    const result = { ok: false, error: { code, message } };
    if (typeof ack === 'function') {
        ack(result);
    } else {
        socket.emit('todo_error', result.error);
    }
}

function send_socket_ok(ack, data = {}) {
    if (typeof ack === 'function') {
        ack({ ok: true, ...data });
    }
}

function selected_list(socket) {
    if (!socket.data || typeof socket.data.listId !== 'string') {
        return null;
    }
    return book.list.find(item => item.id === socket.data.listId) || null;
}

function normalize_list_name(value) {
    if (typeof value !== 'string') {
        throw new TypeError('List name must be a string');
    }

    const name = value.replace(/\0/g, '').trim();
    if (name.length === 0 || name.length > 50) {
        throw new TypeError('List name must contain 1 to 50 characters');
    }
    if (/[\u0000-\u001f\u007f]/.test(name)) {
        throw new TypeError('List name contains control characters');
    }
    return name;
}

io.on('connection', socket => {
    socket.data = { listId: null };

    socket.on('look', (list_id, ack) => {
        if (typeof list_id !== 'string' || list_id.length > 100) {
            send_socket_error(socket, ack, 'INVALID_LIST_ID', 'Invalid todo list ID');
            return;
        }

        const list = book.list.find(item => item.id === list_id);
        if (!list) {
            send_socket_error(socket, ack, 'LIST_NOT_FOUND', 'Todo list not found');
            return;
        }

        if (socket.data.listId !== null) {
            socket.leave(room_name(socket.data.listId));
        }
        socket.data.listId = list.id;
        socket.join(room_name(list.id));
        socket.emit('set', list);
        send_socket_ok(ack, { listId: list.id });
    });

    socket.on('edit', (item_id, new_value, ack) => {
        const list = selected_list(socket);
        if (!list) {
            send_socket_error(socket, ack, 'LIST_NOT_SELECTED', 'Select a todo list first');
            return;
        }
        if (typeof item_id !== 'string' || item_id.length > 100) {
            send_socket_error(socket, ack, 'INVALID_ITEM_ID', 'Invalid todo item ID');
            return;
        }

        const index = list.list.findIndex(item => item.id === item_id);
        if (index < 0) {
            send_socket_error(socket, ack, 'ITEM_NOT_FOUND', 'Todo item not found');
            return;
        }

        let value;
        try {
            value = filter(new_value);
        } catch (error) {
            send_socket_error(socket, ack, 'INVALID_ITEM', error.message);
            return;
        }

        const old_item = list.list[index];
        const updated_item = new TodoItem(
            value.title,
            value.content,
            value.importance,
            value.finished,
            old_item.id,
        );

        try {
            database.update_item(list, updated_item);
        } catch (error) {
            console.error(`[Persist] Edit failed: ${error.message}`);
            send_socket_error(socket, ack, 'PERSIST_FAILED', 'Unable to save the change');
            return;
        }

        list.list[index] = updated_item;
        io.to(room_name(list.id)).emit('set', list);
        console.log(`[Edit] Item in list '${list.name}'`);
        send_socket_ok(ack);
    });

    socket.on('achieve_list', ack => {
        const list = selected_list(socket);
        if (!list) {
            send_socket_error(socket, ack, 'LIST_NOT_SELECTED', 'Select a todo list first');
            return;
        }

        try {
            database.achieve_list(list);
        } catch (error) {
            console.error(`[Persist] Achieve failed: ${error.message}`);
            send_socket_error(socket, ack, 'PERSIST_FAILED', 'Unable to save the change');
            return;
        }

        list.finished = true;
        io.to(room_name(list.id)).emit('set', list);
        console.log(`[Achieve] List '${list.name}'`);
        send_socket_ok(ack);
    });

    socket.on('add', (new_value, ack) => {
        const list = selected_list(socket);
        if (!list) {
            send_socket_error(socket, ack, 'LIST_NOT_SELECTED', 'Select a todo list first');
            return;
        }
        if (list.list.length >= MAX_ITEMS_PER_LIST) {
            send_socket_error(socket, ack, 'ITEM_LIMIT_REACHED', 'This todo list has reached its item limit');
            return;
        }

        let value;
        try {
            value = filter(new_value);
        } catch (error) {
            send_socket_error(socket, ack, 'INVALID_ITEM', error.message);
            return;
        }

        const item = new TodoItem(value.title, value.content, value.importance, false);
        try {
            database.add_item(list, item);
        } catch (error) {
            console.error(`[Persist] Add failed: ${error.message}`);
            send_socket_error(socket, ack, 'PERSIST_FAILED', 'Unable to save the change');
            return;
        }

        list.list.push(item);
        io.to(room_name(list.id)).emit('set', list);
        console.log(`[Add] Item '${value.title}'`);
        send_socket_ok(ack, { itemId: item.id });
    });
});

app.use(express.json({ limit: '16kb' }));

app.get('/healthz', (req, res) => {
    res.json({ ok: true });
});

app.get('/api/list', (req, res) => {
    res.json(book.list);
});

function create_list(name, res) {
    let normalized_name;
    try {
        normalized_name = normalize_list_name(name);
    } catch (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    if (book.list.length >= MAX_LISTS) {
        res.status(409).json({ error: 'The todo list limit has been reached' });
        return;
    }

    if (book.list.some(item => item.name === normalized_name)) {
        res.status(409).json({ error: 'A todo list with this name already exists' });
        return;
    }

    const list = new TodoList(normalized_name);
    try {
        database.create_list(list);
    } catch (error) {
        console.error(`[Persist] New list failed: ${error.message}`);
        const status = /UNIQUE|constraint/i.test(error.message) ? 409 : 500;
        res.status(status).json({ error: status === 409 ? 'A todo list with this name already exists' : 'Unable to save the new todo list' });
        return;
    }

    book.list.push(list);
    console.log(`[New] List '${list.name}'`);
    res.status(201).json({ id: list.id, name: list.name });
}

// JSON body is preferred because it preserves spaces and special characters.
app.post('/api/list', (req, res) => {
    create_list(req.body && req.body.name, res);
});

app.post('/api/list/:name', (req, res) => {
    create_list(req.params.name, res);
});

app.use(express.static(path.resolve(__dirname, '../frontend/dist')));

app.use((error, req, res, next) => {
    console.error(`[HTTP] ${error.message}`);
    if (res.headersSent) {
        next(error);
        return;
    }
    res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535');
}

server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}.`);
});

function shutdown(signal) {
    console.log(`${signal} received, shutting down.`);
    io.close();
    server.close(() => {
        database.close();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

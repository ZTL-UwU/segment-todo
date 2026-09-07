const assert = require('node:assert/strict');
const test = require('node:test');

const { filter } = require('../filter');
const { TodoItem, TodoList } = require('../list');
const { TodoDatabase } = require('../database');

test('filter validates and normalizes todo input', () => {
    assert.deepEqual(filter({ title: '  task ', content: 'details', importance: 10 }), {
        title: 'task',
        content: 'details',
        importance: 10,
        finished: false,
    });
    assert.throws(() => filter({ title: 'task', content: 'details', finished: 'false' }));
    assert.throws(() => filter({ title: null, content: 'details' }));
    assert.throws(() => filter({ title: 'task', content: 'details', importance: 11 }));
});

test('SQLite stores and reloads todo data', () => {
    const database = new TodoDatabase(':memory:');
    const list = new TodoList('first');
    const item = new TodoItem('task', 'details', 1, false);

    try {
        database.create_list(list);
        database.add_item(list, item);
        const loaded = database.load_book();
        assert.equal(loaded.list[0].name, 'first');
        assert.equal(loaded.list[0].list[0].title, 'task');
        assert.equal(loaded.list[0].list[0].id, item.id);
    } finally {
        database.close();
    }
});

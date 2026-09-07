const { randomUUID } = require('crypto');

let TodoItemTmp = class {
    constructor(title, content, importance, finished, id) {
        this.id = id || randomUUID();
        this.title = title;
        this.content = content;
        this.importance = importance;
        this.finished = finished;
    }
};
module.exports.TodoItem = TodoItemTmp;

let TodoListTmp = class {
    constructor(name, id) {
        this.id = id || randomUUID();
        this.name = name;
        this.finished = false;
        this.list = new Array();
    }
};
module.exports.TodoList = TodoListTmp;

module.exports.TodoBook = class TodoBook {
    constructor() {
        this.list = new Array();
    }
};

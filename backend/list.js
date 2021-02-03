let TodoItemTmp = class {
    constructor(title, content, importance, finished) {
        this.title = title;
        this.content = content;
        this.importance = importance || 0;
        this.finished = finished || false;
    }

    parse_from_obj(data) {
        this.title = data.title;
        this.content = data.content;
        this.importance = data.importance;
        this.finished = data.finished;
    }
};
module.exports.TodoItem = TodoItemTmp;

let TodoListTmp = class {
    constructor(name) {
        this.name = name;
        this.finished = false;
        this.list = new Array();
    }
    
    parse_from_obj(data) {
        this.name = data.name;
        this.finished = data.finished;
        for (let x of data.list) {
            let n = new TodoItemTmp();
            n.parse_from_obj(x);
            this.list.push(n);
        }
    }
};
module.exports.TodoList = TodoListTmp;

module.exports.TodoBook = class TodoBook {
    constructor() {
        this.list = new Array();
    }
    
    parse_from_obj(data) {
        for (let x of data.list) {
            let n = new TodoListTmp();
            n.parse_from_obj(x);
            this.list.push(n);
        }
    }
};

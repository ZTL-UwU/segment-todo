const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { TodoBook, TodoItem, TodoList } = require('./list');

function database_path(configured_path) {
    if (configured_path === ':memory:') {
        return configured_path;
    }
    return path.resolve(configured_path || path.join(__dirname, 'todo.sqlite'));
}

class TodoDatabase {
    constructor(configured_path) {
        this.path = database_path(configured_path || process.env.DB_PATH);
        if (this.path !== ':memory:') {
            fs.mkdirSync(path.dirname(this.path), { recursive: true });
        }

        this.db = new DatabaseSync(this.path, {
            timeout: 5000,
            enableForeignKeyConstraints: true,
        });
        this.db.exec(`
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;

            CREATE TABLE IF NOT EXISTS todo_lists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                finished INTEGER NOT NULL DEFAULT 0 CHECK (finished IN (0, 1)),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) STRICT;

            CREATE TABLE IF NOT EXISTS todo_items (
                id TEXT PRIMARY KEY,
                list_id TEXT NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
                position INTEGER NOT NULL CHECK (position >= 0),
                title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 50),
                content TEXT NOT NULL CHECK (length(content) <= 1000),
                importance INTEGER NOT NULL DEFAULT 0 CHECK (importance BETWEEN 0 AND 10),
                finished INTEGER NOT NULL DEFAULT 0 CHECK (finished IN (0, 1)),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (list_id, position)
            ) STRICT;

            CREATE INDEX IF NOT EXISTS todo_items_list_position
                ON todo_items (list_id, position);
        `);

        if (this.path !== ':memory:') {
            fs.chmodSync(this.path, 0o600);
        }
    }

    load_book() {
        const book = new TodoBook();
        const lists = this.db.prepare(`
            SELECT id, name, finished
            FROM todo_lists
            ORDER BY created_at, rowid
        `).all();
        const items = this.db.prepare(`
            SELECT id, list_id, title, content, importance, finished
            FROM todo_items
            ORDER BY list_id, position
        `).all();
        const lists_by_id = new Map();

        for (const row of lists) {
            const list = new TodoList(row.name, row.id);
            list.finished = row.finished === 1;
            book.list.push(list);
            lists_by_id.set(row.id, list);
        }

        for (const row of items) {
            const list = lists_by_id.get(row.list_id);
            if (list) {
                list.list.push(new TodoItem(
                    row.title,
                    row.content,
                    row.importance,
                    row.finished === 1,
                    row.id,
                ));
            }
        }

        return book;
    }

    create_list(list) {
        this.transaction(() => {
            this.db.prepare(`
                INSERT INTO todo_lists (id, name, finished)
                VALUES (?, ?, ?)
            `).run(list.id, list.name, list.finished ? 1 : 0);
        });
    }

    add_item(list, item) {
        this.transaction(() => {
            const next_position = this.db.prepare(`
                SELECT COALESCE(MAX(position) + 1, 0) AS position
                FROM todo_items
                WHERE list_id = ?
            `).get(list.id).position;

            this.db.prepare(`
                INSERT INTO todo_items
                    (id, list_id, position, title, content, importance, finished)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                item.id,
                list.id,
                next_position,
                item.title,
                item.content,
                item.importance,
                item.finished ? 1 : 0,
            );
        });
    }

    update_item(list, item) {
        this.transaction(() => {
            const result = this.db.prepare(`
                UPDATE todo_items
                SET title = ?, content = ?, importance = ?, finished = ?
                WHERE id = ? AND list_id = ?
            `).run(
                item.title,
                item.content,
                item.importance,
                item.finished ? 1 : 0,
                item.id,
                list.id,
            );
            if (result.changes !== 1) {
                throw new Error('Todo item no longer exists');
            }
        });
    }

    achieve_list(list) {
        this.transaction(() => {
            const result = this.db.prepare(`
                UPDATE todo_lists
                SET finished = 1
                WHERE id = ?
            `).run(list.id);
            if (result.changes !== 1) {
                throw new Error('Todo list no longer exists');
            }
        });
    }

    transaction(operation) {
        this.db.exec('BEGIN IMMEDIATE');
        try {
            const result = operation();
            this.db.exec('COMMIT');
            return result;
        } catch (error) {
            try {
                this.db.exec('ROLLBACK');
            } catch (_) {
                // Preserve the original database error.
            }
            throw error;
        }
    }

    close() {
        if (this.db.isOpen) {
            this.db.close();
        }
    }
}

module.exports = { TodoDatabase };

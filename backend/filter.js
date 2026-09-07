const MAX_TITLE_LENGTH = 50;
const MAX_CONTENT_LENGTH = 1000;

module.exports.filter = function filter(new_val) {
    if (new_val === null || typeof new_val !== 'object' || Array.isArray(new_val)) {
        throw new TypeError('Todo item must be an object');
    }

    if (typeof new_val.title !== 'string') {
        throw new TypeError('Todo item title must be a string');
    }
    if (typeof new_val.content !== 'string') {
        throw new TypeError('Todo item content must be a string');
    }

    const title = new_val.title.replace(/\0/g, '').trim();
    const content = new_val.content.replace(/\0/g, '');
    if (title.length === 0) {
        throw new TypeError('Todo item title cannot be empty');
    }

    const importance = Number(new_val.importance ?? 0);
    if (!Number.isInteger(importance) || importance < 0 || importance > 10) {
        throw new TypeError('Todo item importance must be an integer from 0 to 10');
    }

    const finished = new_val.finished ?? false;
    if (typeof finished !== 'boolean') {
        throw new TypeError('Todo item finished must be a boolean');
    }

    return {
        title: title.slice(0, MAX_TITLE_LENGTH),
        content: content.slice(0, MAX_CONTENT_LENGTH),
        importance,
        finished,
    };
};

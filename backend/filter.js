module.exports.filter = function(new_val) {
    new_val.title = new_val.title.substr(0, 50);
    new_val.content = new_val.content.substr(0, 1000);
    new_val.importance = parseInt(new_val.importance) || 0;
    new_val.finished = new_val.finished === true || !new_val.finished === false;

    return new_val;
}
const fs = require('fs');
const path = require('path');

const exportJson = (json, fileName = './ast.json') => {
    const content = JSON.stringify(json);
    fs.writeFileSync(path.resolve(__dirname, fileName), content);
};

module.exports = {
    exportJson,
};

const http = require('http')
const querystring = require('querystring')
const fs = require('fs')
const func = require('./func')

let global = {};

function atob(dat) {
    return Buffer.from(dat, 'base64').toString();
}

function handle(data) {
    if (data == null) return;
    if (typeof(data.base) !== 'undefined') {
        let ndat = atob(data.base);
        return handle(querystring.parse(ndat));
    }
    if (typeof(data.method) === 'undefined') return "null";
    let method = data.method;
    let key = data.key;
    if (method === 'get') {
        if (typeof(data.key) === 'undefined') return "null";
        let arr = key.split('.');
        let cur = global;
        for (let i = 0; i < arr.length; i++) {
            if (typeof(cur[arr[i]]) === 'undefined') return "null";
            cur = cur[arr[i]];
        }
        return JSON.stringify(cur);
    } else if (method === 'set') {
        if (typeof(data.key) === 'undefined') return "null";
        if (typeof(data.val) === 'undefined') return "null";
        let cur = global;
        let arr = key.split('.');
        for (let i = 0; i < arr.length - 1; i++) {
            if (typeof(cur[arr[i]]) === 'undefined') cur[arr[i]] = {};
            cur = cur[arr[i]];
        }
        cur[arr[arr.length - 1]] = data.val;
        return "true";
    } else if (method === 'all') {
        return JSON.stringify(global);
    } else if (method === 'setj') {
        if (typeof(data.key) === 'undefined') return "null";
        if (typeof(data.val) === 'undefined') return "null";
        let cur = global;
        let arr = key.split('.');
        for (let i = 0; i < arr.length - 1; i++) {
            if (typeof(cur[arr[i]]) === 'undefined') cur[arr[i]] = {};
            cur = cur[arr[i]];
        }
        cur[arr[arr.length - 1]] = JSON.parse(data.val);
        // console.log(global, cur);
        return "true";
    } else if (method === 'save') {
        if (typeof(data.file) === 'undefined') return "null";
        if (data.file.split('/').length > 1) return "false";
        let res = JSON.stringify(global);
        fs.writeFile(data.file, res, () => {});
        return "true";
    } else if (method === 'load') {
        if (typeof(data.file) === 'undefined') return "null";
        if (data.file.split('/').length > 1) return "false";
        fs.readFile(data.file, (err, dat) => {
            global = JSON.parse(dat);
        })
        return "true";
    } else if (method === 'erase') {
        if (typeof(data.key) === 'undefined') return "null";
        let cur = global;
        let arr = key.split('.');
        let i = 0;
        for (; i < arr.length - 1; i++) {
            if (typeof(cur[arr[i]]) === 'undefined') break;
            cur = cur[arr[i]];
        }
        if (i > 0) cur[arr[i - 1]] = undefined;
        return "true";
    } else if (method === 'func') {
        if (typeof(data.func) === 'undefined' || typeof(func[data.func]) === 'undefined') return "null";
        return func[data.func](data, global);
    }
    return JSON.stringify(data)
}

http.createServer(function (req, res) {
    res.setHeader("Content-Type", "application/json;charset=UTF-8");
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        if (req.method.toUpperCase() === 'POST') {
            let postData = '';
            req.on('data', data => postData += data);
            req.on('end', () => {
                res.write(handle(querystring.parse(postData)));
                postData = ''
                res.end();
            });
        } else if (req.method.toUpperCase() === 'GET') {
            res.end(handle(querystring.parse(req.url.split('?')[1])))
        } else {
            res.end();
        }
    } catch (err) {
        res.statusCode = 400;
        res.statusMessage = "Bad Request";
        res.end("null");
    }
}).listen(15400)

console.log("Server running successfully")

const os = require('os');
// const fs = require('fs');
// const path = require('path');
const http = require('http');
const open = require('open');
const Koa = require('koa');
const KSR = require('koa-static-resolver');
const KoaRouter = require('@koa/router');

const EC = require('eight-colors');
const SocketIO = require('socket.io');

const getInternalIp = () => {
    const n = os.networkInterfaces();
    //console.log(n);
    const list = [];
    for (const k in n) {
        const inter = n[k];
        for (const j in inter) {
            const item = inter[j];
            if (item.family === 'IPv4' && !item.internal) {
                const a = item.address;
                console.log(`Internal IP: ${a}`);
                if (a.startsWith('192.') || a.startsWith('10.')) {
                    list.push(a);
                }
            }
        }
    }
    return list.pop();
};


const cacheList = new Set();
let timeout_open;
let sockets;

const updateList = function() {
    if (!sockets) {
        return;
    }
    const nameList = Array.from(cacheList);
    nameList.sort();

    sockets.emit('data', {
        action: 'list',
        data: nameList
    });
};

const initSocketServer = (server) => {
    const socketIO = SocketIO(server, {
        maxHttpBufferSize: 1e8
    });

    socketIO.on('connection', function(client) {

        client.on('data', function(data) {
            if (data.action === 'delete' && data.data) {
                cacheList.delete(data.data);
                updateList();
            }
        });

        client.on('disconnect', function() {
            console.log(`${new Date().toString()} ${EC.yellow('a page disconnected')}`);
        });

        //new user connected
        console.log(`${new Date().toString()} ${EC.green('a page connected')}`);
        clearTimeout(timeout_open);
        updateList();

    });

    sockets = socketIO.sockets;

    //console.log(socketIO, sockets);

};


const port = 8080;

const app = new Koa();

app.use(KSR({
    dirs: ['./']
}));

const actions = {

    qrcode: (ctx) => {
        ctx.body = {
            url: `http://${getInternalIp()}:${port}/client/lucky/input.html`
        };
    },

    add: (ctx, data) => {

        const n = `${data.name}`.trim();
        if (n) {
            cacheList.add(n);
        }

        updateList();

        ctx.body = {
            ok: true
        };

    },

    empty: (ctx, data) => {
        cacheList.clear();

        updateList();

        ctx.body = {
            ok: true
        };

    }

};

//https://github.com/koajs/router
const router = new KoaRouter();
router.all('/:action', (ctx) => {
    const action = ctx.params.action;
    //console.log('action', action);
    if (!action) {
        return;
    }

    const actionHandler = actions[action];
    if (!actionHandler) {
        return;
    }

    const data = {
        ... ctx.request.body,
        ... ctx.request.query
    };

    return actionHandler(ctx, data);
});

app.use(router.routes()).use(router.allowedMethods());

const server = http.createServer(app.callback());
initSocketServer(server);

server.listen(port, () => {

    const url = `http://localhost:${port}`;
    console.log(`${new Date().toString()} start server: ${url}`);

    timeout_open = setTimeout(function() {
        console.log(`Open ${url}`);
        open(url);
    }, 2000);

});


const TWEEN = window.TWEEN;
//global instance
const lucky = {
    step: '',
    itemWidth: 150,
    itemHeight: 50
};

const renderElement = function(elem, d) {
    const translate = `translateX(${d.x}px) translateY(${d.y}px)`;
    const rotate = `rotateZ(${d.z}deg)`;
    const scale = `scale(${d.scale})`;
    const transform = [translate, rotate, scale].join(' ');
    //console.log(transform);
    elem.style.transform = transform;
};

const renderGroup = function(d) {
    renderElement(lucky.object.group.element, d);
};


const renderStart = function() {

    TWEEN.removeAll();

    const duration = 1000;
    const object = lucky.object;
    const target = lucky.target;
    const type = target.type;
    lucky.$group.className = `lucky-group lucky-group-${type}`;

    object.list.forEach(function(objectItem, i) {
        const targetItem = target.list[i];

        new TWEEN.Tween(objectItem.state)
            .to(targetItem.state, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .onUpdate(function(d) {
                renderElement(objectItem.element, d);
            })
            .start();

    });

    new TWEEN.Tween(object.group.state)
        .to(target.group.state, duration)
        .easing(TWEEN.Easing.Exponential.InOut)
        .onUpdate(function(d) {
            renderGroup(d);
        })
        .start();

};

const renderStop = function() {
    const duration = 500;
    const object = lucky.object;
    const target = lucky.target;

    const state = {
        ... target.group.state,
        scale: 2
    };

    const y = state.y + (lucky.donutR - lucky.itemHeight) * state.scale;
    state.y = y;

    const index = Math.floor(lucky.list.length * Math.random());
    const z = lucky.angle * index + 270;
    //console.log(state.z, z);
    state.z = z;


    new TWEEN.Tween(object.group.state)
        .to(state, duration)
        .easing(TWEEN.Easing.Exponential.InOut)
        .onUpdate(function(d) {
            renderGroup(d);
        })
        .start();
};

const updateAnimation = function() {
    if (lucky.step === 'start') {
        const speed = 360 / lucky.list.length / 10;
        const state = lucky.target.group.state;
        const z = (state.z + speed) % 360;
        state.z = z;
        renderGroup(state);
    }

    TWEEN.update();
};

const renderList = function() {

    const defaultState = {
        x: 0,
        y: 0,
        z: 0,
        scale: 1
    };

    const len = lucky.list.length;
    const angle = 360 / len;
    lucky.angle = angle;

    const nw = Math.floor(lucky.containerWidth / lucky.itemWidth);

    const iw = Math.floor(lucky.containerWidth / nw);
    const ih = lucky.itemHeight;

    //周长
    const padding = 20;
    const minItems = 10;
    const perimeter = Math.max(len, minItems) * (iw + padding);
    const donutR = Math.round(perimeter / (2 * Math.PI));
    lucky.donutR = donutR;
    const scale = lucky.width / (donutR * 2);
    //console.log(lucky.width, r);
    //console.log(scale);

    //===========================================================================
    lucky.object = {
        group: {
            element: lucky.$group,
            state: {
                ... defaultState
            }
        },
        list: []
    };
    lucky.targets = {
        table: {
            type: 'table',
            group: {
                state: {
                    ... defaultState
                }
            },
            list: []
        },
        donut: {
            type: 'donut',
            group: {
                state: {
                    ... defaultState,
                    x: lucky.containerWidth * 0.5,
                    y: lucky.containerHeight * 0.5,
                    scale
                }
            },
            list: []
        }
    };


    //===========================================================================
    lucky.$group.innerHTML = '';

    lucky.list.forEach(function(item, index) {
        const $item = document.createElement('div');
        $item.title = '双击删除';
        $item.className = `lucky-item lucky-item-${index}`;
        $item.innerHTML = `<div class="lucky-item-content" data="${item}"><i>${index + 1}</i> ${item}</div>`;
        lucky.$group.appendChild($item);

        //for table
        const xIndex = index % nw;
        const yIndex = Math.floor(index / nw);

        const px = (xIndex + 0.5) * iw;
        const py = (yIndex + 0.5) * ih;

        lucky.object.list.push({
            element: $item,
            state: {
                ... defaultState,
                x: px,
                y: py
            }
        });

        //default table
        lucky.targets.table.list.push({
            state: {
                ... defaultState,
                x: px,
                y: py
            }
        });

        //for donut
        const dr = (angle * index) / 180 * Math.PI;
        const dl = donutR - ih;
        const dx = dl * Math.cos(dr);
        const dy = dl * Math.sin(dr);

        const deg = 180 * dr / Math.PI;

        //console.log(index, dr, deg);

        const dz = 90 + deg;

        lucky.targets.donut.list.push({
            state: {
                ... defaultState,
                x: dx,
                y: dy,
                z: dz
            }
        });

    });

};

const initList = function(list) {
    console.log(list);

    //TODO
    // let i = 0;
    // const ts = ['张三', '李四儿', '王五'];
    // const l = Math.ceil(50 * Math.random());
    // while (i < l) {
    //     list.push(ts[Math.floor(Math.random() * ts.length)]);
    //     i++;
    // }

    lucky.list = list;
    if (lucky.step) {
        return;
    }

    renderList();

    lucky.target = lucky.targets.table;
    renderStart();
};

const startHandler = function() {
    console.log('start');
    lucky.step = 'start';
    lucky.target = lucky.targets.donut;
    renderStart();
};

const stopHandler = function() {
    console.log('stop');
    lucky.step = 'stop';
    renderStop();
};

const resetHandler = function() {
    console.log('reset');
    lucky.step = '';
    lucky.target = lucky.targets.table;
    renderStart();
};


const initSocket = function() {

    const showLog = function(msg) {
        console.log(`[socket] ${msg}`);
    };

    if (!window.io) {
        showLog('not found io');
        return;
    }

    const socket = window.io.connect('/');

    lucky.socket = socket;

    let server_connected = false;
    let has_error = false;
    let reconnect_times = 0;

    const reload = function() {
        socket.close();
        window.location.reload();
    };

    socket.on('data', function(data) {
        if (server_connected) {
            if (data.action === 'list' && data.data) {
                initList(data.data);
            }
        }
    });
    socket.on('connect', function(data) {
        showLog('socket connected');
        if (server_connected) {
            if (has_error) {
                reload();
            }
        }
        server_connected = true;
        has_error = false;
        reconnect_times = 0;
    });

    socket.on('connect_error', function(data) {
        showLog('socket connection error');
        has_error = true;
    });

    socket.on('connect_timeout', function(data) {
        showLog('socket connection timeout');
    });

    socket.on('reconnecting', function(data) {
        reconnect_times += 1;
        showLog(`socket reconnecting ... ${reconnect_times}`);
        if (reconnect_times > 20) {
            socket.close();
            showLog(`socket closed after retry ${reconnect_times} times`);
        }
    });

    socket.on('reconnect_error', function(data) {
        showLog('socket reconnection error');
        has_error = true;
    });

    socket.on('reconnect_failed', function(data) {
        showLog('socket reconnection failed');
        has_error = true;
    });

};

const initMenu = function() {

    const $menu = document.querySelector('.lucky-menu');
    const $popover = document.querySelector('.lucky-popover');


    $menu.addEventListener('mouseenter', function(e) {
        $popover.style.display = 'block';
    });

    $menu.addEventListener('mouseleave', function(e) {
        $popover.style.display = 'none';
    });

    const $add = document.querySelector('.lucky-add-button');
    const $name = document.querySelector('.lucky-add-name');
    const $empty = document.querySelector('.lucky-empty-button');

    const addHandler = function() {
        const v = $name.value;

        if (!v) {
            $name.focus();
            return;
        }

        console.log(v);
        window.fetch(`/add?name=${v}`).then(function(response) {
            return response.json();
        }, function(err) {
            console.log(err);
        }).then(function(data) {
            console.log(data);
            $name.value = '';
        });
    };

    $add.addEventListener('click', function(e) {
        addHandler();
    });
    $name.addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
            addHandler();
        }
    });

    $empty.addEventListener('click', function(e) {

        const $bt = document.querySelector('#lucky-empty-checkbox');
        if (!$bt.checked) {
            $bt.focus();
            return;
        }

        window.fetch('/empty').then(function(response) {
            return response.json();
        }, function(err) {
            console.log(err);
        }).then(function(data) {
            console.log(data);
            $bt.checked = false;
        });

    });


};


const showQrCode = function() {
    //show qrcode
    window.axios.get('/qrcode').then(function(res) {
        console.log(res.data.url);
        const $qrcodeUrl = document.querySelector('.lucky-qrcode-url');
        $qrcodeUrl.innerHTML = '请连 WIFI 扫码';
        const $qrcodeCanvas = document.querySelector('.lucky-qrcode-canvas');
        window.QRCode.toCanvas($qrcodeCanvas, res.data.url, {
            width: 300
        }, function(error) {
            if (error) {
                console.error(error);
            }
            console.log('qrcode success!');
        });
    });

};

const showStars = function() {
    const $holder = document.querySelector('.lucky-main');
    const $canvas = document.querySelector('.lucky-starts-canvas');
    const ctx = $canvas.getContext('2d');
    const w = $holder.clientWidth;
    const h = $holder.clientHeight;
    $canvas.width = w;
    $canvas.height = h;

    //console.log(w, h);

    const maxStars = 300;

    const stars = [];
    for (let i = 0; i < maxStars; i++) {
        stars.push(new window.LuckyStar(ctx, w, h, maxStars));
    }

    return function() {
        ctx.clearRect(0, 0, w, h);
        stars.forEach(function(star) {
            star.draw();
        });
    };
};

const luckyInit = function() {

    initSocket();

    initMenu();

    showQrCode();

    const $container = document.querySelector('.lucky-container');
    const b = $container.getBoundingClientRect();

    lucky.containerWidth = $container.clientWidth;
    lucky.containerHeight = $container.clientHeight;

    lucky.width = Math.floor(b.width);
    lucky.height = Math.floor(b.height);

    //console.log(lucky, b);

    lucky.$container = $container;

    //start button
    const $start = document.querySelector('.lucky-start-button');
    $start.addEventListener('click', function(e) {
        if (!lucky.list.length) {
            return;
        }

        const v = $start.innerHTML;
        if (v === '开始') {
            startHandler();
            $start.innerHTML = '停止';
        } else if (v === '停止') {
            stopHandler();
            $start.innerHTML = '重置';
        } else {
            $start.innerHTML = '开始';
            resetHandler();
        }
    });

    //delete handler
    $container.addEventListener('dblclick', function(e) {
    //console.log(e.target);
        const n = e.target.getAttribute('data');
        if (n && lucky.socket) {
            console.log(`delete ${n}`);
            lucky.socket.emit('data', {
                action: 'delete',
                data: n
            });
        }
    });

    $container.addEventListener('click', function(e) {
        const n = e.target.getAttribute('data');
        if (n) {
            console.log(n);
        }
    });

    const $group = document.createElement('div');
    $container.appendChild($group);

    lucky.$group = $group;

    const updateStars = showStars();

    function animate() {
        requestAnimationFrame(animate);
        updateStars();
        updateAnimation();
    }

    animate();

};

window.luckyStart = function(currentSlide) {
    if (!currentSlide) {
        return;
    }

    const $elem = currentSlide.querySelector('.lucky');
    if (!$elem) {
        return;
    }

    if (lucky.hasInit) {
        return;
    }
    lucky.hasInit = true;

    luckyInit();

};

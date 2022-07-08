
window.LuckyStar = class {

    constructor(ctx, w, h, maxStars) {
        this.ctx = ctx;
        this.orbitRadius = this.random(this.maxOrbit(w, h));

        //大小
        this.radius = this.random(30, this.orbitRadius) / 10;

        this.orbitX = w / 2;
        this.orbitY = h / 2;
        this.timePassed = this.random(0, maxStars);

        //速度
        this.speed = this.random(this.orbitRadius) / 150000;

        this.alpha = this.random(2, 10) / 10;
    }

    draw() {
        const x = Math.cos(this.timePassed) * this.orbitRadius + this.orbitX;
        const y = Math.sin(this.timePassed) * this.orbitRadius + this.orbitY;
        const twinkle = this.random(10);

        if (twinkle === 1 && this.alpha > 0) {
            this.alpha -= 0.05;
        } else if (twinkle === 2 && this.alpha < 1) {
            this.alpha += 0.05;
        }

        this.ctx.globalAlpha = this.alpha;
        this.ctx.drawImage(this.getItem(), x - this.radius / 2, y - this.radius / 2, this.radius, this.radius);

        this.timePassed += this.speed;
    }

    getItem() {

        if (this.starItem) {
            return this.starItem;
        }

        const color = '123 158 248';
        const starItem = document.createElement('canvas');
        const ctx = starItem.getContext('2d');
        starItem.width = 100;
        starItem.height = 100;
        const half = starItem.width / 2;
        const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
        gradient.addColorStop(0, `rgb(${color} / 100%)`);
        gradient.addColorStop(0.1, `rgb(${color} / 80%)`);
        gradient.addColorStop(0.25, `rgb(${color} / 30%)`);
        gradient.addColorStop(1, `rgb(${color} / 0%)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(half, half, half, 0, Math.PI * 2);
        ctx.fill();

        this.starItem = starItem;

        return starItem;
    }

    maxOrbit(x, y) {
        const max = Math.max(x, y);
        const diameter = Math.round(Math.sqrt(max * max + max * max));
        return diameter / 2;
    }

    random(min, max) {
        if (arguments.length < 2) {
            max = min;
            min = 0;
        }

        if (min > max) {
            const hold = max;
            max = min;
            min = hold;
        }

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};


export default class {
    
    constructor(tx, ty, repeat) {
        this.tx = tx;
        this.ty = ty;
        this.repeat = repeat;
    }

    getRects(w, h) {
        var rects = [];

        var tx = this.tx % 1;
        var ty = this.ty % 1;
        var dw = w / (this.repeat + 1);
        var dh = h / (this.repeat + 1);

        for (var x = -1; x <= this.repeat; x++)
            for (var y = -1; y <= this.repeat; y++) {
                var px = x * dw + tx * dw;
                var py = y * dh + ty * dh;

                rects.push([px, py, dw, dh]);
            }
        return rects;
    }

}
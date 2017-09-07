export default class {
    
    constructor(count, margin) {
        this.count = count;
        this.margin = margin;
    }

    getBricks(w, h) {
        var bricks = [];
        var ly = this.count * 2;

        var m = this.margin / ly;
        var mw = Math.round(m * w);
        var mh = Math.round(m * h);
        
        for (var y = 0; y < ly * 2; y++)
            for (var x = 0, lx = ly / 2 + y % 2; x < lx; x++) {
                var hd = h / ly;
                var wd = w / ly * 2;
                var oy = y * hd;
                var ox = y % 2 * (-wd / 2) + x * wd;
                
                bricks.push([ox + mw, oy + mh, wd - 2 * mw, hd - 2 * mh]);
            }
        return bricks;
    }

}
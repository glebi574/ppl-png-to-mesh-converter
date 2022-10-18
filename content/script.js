
const size = 1.823358421; //line width in ppl to overlap gradient(1.823358421 for pc, 2.418367347 for phone)

const px = 1; //pixels per line to be compressed
const s = px * px; //amount of pixels in part to be compressed
const compression = 12; //compression level(how much colors can differ to be united in one line) 0 - 256

const number_rounding = true; //if true, numbers will be rounded(mostly can't be seen)
const y_color_interpolation = false; //if true, similar colors on some lines will be interpolated(decreases size) //don't

const source = "img.png" //file path

function get_rgba(square) {
    let r = g = b = a = 0;
    for (i = 0; i < s; ++i) {
        r += square.data[    i * 4];
        g += square.data[1 + i * 4];
        b += square.data[2 + i * 4];
        a += square.data[3 + i * 4];
   }
    r = Math.trunc(r / s);
    g = Math.trunc(g / s);
    b = Math.trunc(b / s);
    a = Math.trunc(a / s);
    return [r, g, b, a];
}

function get_color(square) {
    return get_color_from_rgba(get_rgba(square));
}

function get_color_from_rgba(rgba) {
    return (((rgba[0] * 256 + rgba[1]) * 256 + rgba[2]) * 256 + 84);
}

function png_to_mesh(ctx, img) {

    let mesh_prototype = []; //array with lines with rgba arrays
    for (y = 0; y < img.height; y += px) {
        let line_prototype = [];
        for (x = 0; x < img.width; x += px) {
            line_prototype.push(get_rgba(ctx.getImageData(x, y, px, px)));
        }
        mesh_prototype.push(line_prototype);
    }

    if (y_color_interpolation) { //color interpolation on different lines
        for (let i of mesh_prototype) {
            console.log(i);
            for (let n = 1; n < i.length; ++n) {
                if (Math.abs(i[n - 1][0] - i[n][0]) < compression && Math.abs(i[n - 1][1] - i[n][1]) < compression
                && Math.abs(i[n - 1][2] - i[n][2]) < compression && Math.abs(i[n - 1][3] - i[n][3]) < compression) {
                    for (let f = 0; f < 4; ++f) {
                        i[n - 1][f] = (i[n - 1][f] + i[n][f]) / 2;
                        i[n][f] = i[n - 1][f];
                    }
                }
            }
        }
    }
    
    let line_units = [] //array with lines with arrays, containing rgba tables, connected if those are similar
    for (let i of mesh_prototype) {
        let line = [];
        let unit = [i[0]];
        for (let n = 1; n < i.length; ++n) {
            if (Math.abs(unit[0][0] - i[n][0]) < compression && Math.abs(unit[0][1] - i[n][1]) < compression
             && Math.abs(unit[0][2] - i[n][2]) < compression && Math.abs(unit[0][3] - i[n][3]) < compression) {
                unit.push(i[n]);
            }
            else {
                line.push(unit);
                unit = [i[n]];
            }
        }
        line.push(unit);
        line_units.push(line);
    }
    //png to mesh
    const height2 = img.height / px * size / 2;
    const width2 = img.width / px * size / 2;
    let mesh = {vertexes:[], segments:[], colors:[]};
    let index = 0;
    for (let y = 0; y < line_units.length; ++y) {
        let x = 0;
        let line_segment = [];
        for (let p of line_units[y]) {
            let x0 = x + size;
            let x1 = x = x + size * p.length;
            if (p.length == 1) {
                mesh.vertexes.push([x0 - width2, height2 - y * size]);
                line_segment.push(index);
                ++index;
                mesh.colors.push(get_color_from_rgba(p[0]));
            } else {
                mesh.vertexes.push([x0 - width2, height2 - y * size]);
                mesh.vertexes.push([x1 - width2, height2 - y * size]);
                line_segment.push(  index);
                line_segment.push(++index);
                ++index;
                let n = Math.floor(p.length / 2);
                let c1 = [0, 0, 0, 0], c2 = [0, 0, 0, 0];
                for (let i = 0; i < n; ++i) {
                    for (let f = 0; f < 4; ++f) {
                        c1[f] += p[i][f];
                        c2[f] += p[p.length + i - n][f];
                    }
                }
                for (let f = 0; f < 4; ++f) {
                    c1[f] = Math.trunc(c1[f] / n);
                    c2[f] = Math.trunc(c2[f] / n);
                }
                mesh.colors.push(get_color_from_rgba(c1));
                mesh.colors.push(get_color_from_rgba(c2));
            }
        }
        mesh.segments.push(line_segment);
    }
    return mesh;
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const img = new Image();
img.src = source;

img.onload = function() {

    ctx.drawImage(img, 0, 0);

    let mesh = png_to_mesh(ctx, img);

    console.log(mesh.vertexes.length);

    const min_color = Math.min(...mesh.colors);

    let str = `local l,o,m,j,x=${mesh.vertexes[0][0].toFixed(2)},${mesh.vertexes[0][1].toFixed(2)},${size.toFixed(2)},-1,${min_color}
    local a,b,c=function(w)local h={}for k=1,#w do if w[k]==l then o=o-m end h[k]={w[k],o} end return h
    end,function(s)local g,z={},{}for n=1,#s do z={}for i=1,s[n] do j=j+1 z[i]=j end g[n]=z end return g
    end,function(s)local g={}for i=1,#s do g[i]=x+s[i] end return g end`;

    str += " meshes={{vertexes=a({";
    for (let i of mesh.vertexes) {
        if (number_rounding) {
            let a = i[0].toFixed(2);
            if (((Math.round(a) + 0.01) >= a) && ((Math.round(a) - 0.01) <= a))
                a = Math.round(a);
            str += `${Number(a)},`;
        } else {
            str += `${i[0]},`;
        }
    }
    str += '}),segments=b({';
    for (let i of mesh.segments) {
        str += `${i.length},`;
    }
    str += '}),colors=c({';
    for (let i of mesh.colors) {
        str += `${i - min_color},`;
    }
    str += '})}}';
    console.log(str);

}

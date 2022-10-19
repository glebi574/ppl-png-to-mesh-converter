
const size = 1.823358421; //line width in ppl to overlap gradient(1.823358421 for pc, 2.418367347 for phone)

const px = 1; //pixels per line to be compressed
const s = px * px; //amount of pixels in part to be compressed
const compression = 12; //compression level(how much colors can differ to be united in one line) 0 - 256

const number_rounding = true; //if true, numbers will be rounded(mostly can't be seen)
const alpha = 48;

const source = "img.png" //file path

function to_float(n, f) {
    let a = n.toFixed(f);
    if (Math.round(a) + 0.01 >= a && Math.round(a) - 0.01 <= a)
        a = Math.round(a);
    return Number(a);
}

function get_rgb(square) {
    let r = g = b = 0;
    for (i = 0; i < s; ++i) {
        r += square.data[    i * 4];
        g += square.data[1 + i * 4];
        b += square.data[2 + i * 4];
   }
    r = Math.trunc(r / s);
    g = Math.trunc(g / s);
    b = Math.trunc(b / s);
    return [r, g, b];
}

function png_to_mesh(ctx, img) {

    let mesh_prototype = []; //array with lines with rgba arrays
    for (y = 0; y < img.height; y += px) {
        let line_prototype = [];
        for (x = 0; x < img.width; x += px) {
            line_prototype.push(get_rgb(ctx.getImageData(x, y, px, px)));
        }
        mesh_prototype.push(line_prototype);
    }
    
    let line_units = [] //array with lines with arrays, containing rgba tables, connected if those are similar
    for (let i of mesh_prototype) {
        let line = [];
        let unit = [i[0]];
        for (let n = 1; n < i.length; ++n) {
            if (Math.abs(unit[0][0] - i[n][0]) < compression && Math.abs(unit[0][1] - i[n][1]) < compression
             && Math.abs(unit[0][2] - i[n][2]) < compression)
                unit.push(i[n]);
            else {
                line.push(unit);
                unit = [i[n]];
            }
        }
        line.push(unit);
        line_units.push(line);
    }
    //png to mesh
    let mesh = {vertexes:[], segments:[], colors:[]};
    let index = 0;

    for (let y = 0; y < line_units.length; ++y) {
        let x = 0;
        for (let p of line_units[y]) {
            let x0 = x + 1;
            let x1 = x = x + p.length;
            if (p.length == 1) {
                mesh.vertexes.push([x0, -y]);
                mesh.segments.push([index, ++index]);
                mesh.colors.push(p[0]);
            } else {
                mesh.vertexes.push([x0, -y]);
                mesh.vertexes.push([x1, -y]);
                mesh.segments.push([index, ++index]);
                mesh.segments.push([index, ++index]);
                let n = Math.floor(p.length / 2);
                let c1 = [0, 0, 0], c2 = [0, 0, 0];
                for (let i = 0; i < n; ++i) {
                    for (let f = 0; f < 3; ++f) {
                        c1[f] += p[i][f];
                        c2[f] += p[p.length + i - n][f];
                    }
                }
                for (let f = 0; f < 3; ++f) {
                    c1[f] = Math.trunc(c1[f] / n);
                    c2[f] = Math.trunc(c2[f] / n);
                }
                mesh.colors.push(c1);
                mesh.colors.push(c2);
            }
        }
    }
    mesh.segments.pop();
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

    const bd = 1 - img.width / px;

    let str = `local x,y,p,o,t,v,u=${to_float(img.width / px * size / 2, 2)},${to_float(img.height / px * size / 2, 2)},`; //values
    str += `${to_float(mesh.vertexes[0][0], 2)},${to_float(mesh.vertexes[0][1], 2)},${to_float(size, 2)},${bd},${alpha} `; //values
    str += `local a,b,c=function(s)local g={}for k=1,#s do p=p+s[k]if p==1 then o=o-1 end g[k]={p*t-x,y+o*t}end return g end,`; //creates vertexes
    str += `function(s)local g={}for n=0,s-1 do g[n+1]={n,n+1}end return g end,`; //creates segments
    str += `function(s)local g={}for i=6,string.len(s),6 do g[#g+1]=u+256*tonumber(string.sub(s,i-5,i),16)end return g end`; //creates colors

    str += " meshes={{vertexes=a({0,";
    for (let i = 1; i < mesh.vertexes.length; ++i) {
        const t = mesh.vertexes[i][0] - mesh.vertexes[i - 1][0];
        if (t == bd)
            str += 'v,';
        else
            str += `${mesh.vertexes[i][0] - mesh.vertexes[i - 1][0]},`;
    }

    str += `}),segments=b(${mesh.segments.length}),colors=c'`;
    for (let i of mesh.colors) {
        for (let n of i) {
            let h = n.toString(16);
            if (h.length == 1)
                h = '0' + h;
            str += `${h}`;
        }
    }
    str += `'}}`;
    console.log(str);

}

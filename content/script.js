
const px = 3; //pixels per line to be compressed
const s = px * px; //amount of pixels in part to be compressed
const size = 1.823358421; //line width in ppl to overlap gradient

let index = 0;
let color, r, g, b, a;

let mesh = {
    vertexes: [],
    segments: [],
    colors: []
};

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const img = new Image();
img.src = "img.png";

img.onload = function() {

    ctx.drawImage(img, 0, 0);
    const height2 = img.height / px * size / 2;
    const width2 = img.width / px * size / 2;

    for (y = 0; y < img.height - px; y += px) {
        for (x = 0; x < img.width - px; x += px) {
            const square = ctx.getImageData(x, y, px, px);
            r = 0, g = 0, b = 0, a = 0;
            for (i = 0; i < s; ++i) {
                 r += square.data[i * 4];
                 g += square.data[1 + i * 4];
                 b += square.data[2 + i * 4];
                 a += square.data[3 + i * 4];
            }
            r = Math.trunc(r / s);
            g = Math.trunc(g / s);
            b = Math.trunc(b / s);
            a = Math.trunc(a / s);

            mesh.vertexes.push([x / px * size        - height2, width2 - y / px * size]);
            mesh.vertexes.push([x / px * size + size - height2, width2 - y / px * size]);

            mesh.segments.push([index, index + 1]);
            index += 2;
            
            color = ((r * 256 + g) * 256 + b) * 256 + a;
            for (i = 0; i < 2; ++i) {
                mesh.colors.push(color);
            }
        }
    }

    let str = "meshes={{vertexes={";
    for (let i of mesh.vertexes) {
        str += `{${i[0]},${i[1]}},`;
    }
    str += '},segments={';
    for (let i of mesh.segments) {
        str += `{${i[0]},${i[1]}},`;
    }
    str += '},colors={';
    for (let i of mesh.colors) {
        str += `0x${i.toString(16)},`;
    }
    str += '}}}';
    console.log(str);

}

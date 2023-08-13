const net = require("net");
const fs = require("fs/promises");
const path = require("path");
const readline = require("readline/promises");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const clearLine = (dir) => {
    return new Promise((resolve, reject) => {
        process.stdout.clearLine(dir, () => {
            resolve();
        });
    });
};
const moveCursor = (dx, dy) => {
    return new Promise((resolve, reject) => {
        process.stdout.moveCursor(dx, dy, () => {
            resolve();
        });
    });
}
const socket = net.createConnection({ port: 3890, host: "::1" }, async () => {

    const filePath = process.argv[2];
    const fileName = path.basename(filePath);
    const fileHandle = await fs.open(filePath, "r");
    const fileReadStream = fileHandle.createReadStream();
    const fileSize = (await fileHandle.stat()).size;

    // -------------------------
    let uploadProgress = 0;
    let bytesUploaded = 0;
    // -------------------------

    socket.write(`FileName: ${fileName}----------`);
    console.log();

    fileReadStream.on("data", async (chunk) => {
        if (socket.write(chunk) === false) {
            fileReadStream.pause();
        }
        bytesUploaded += chunk.length;
        let newProgress = Math.floor((bytesUploaded / fileSize) * 100);
        if (newProgress !== uploadProgress) {
            uploadProgress = newProgress;
            await moveCursor(0, -1);
            await clearLine(0);
            console.log(`File Uploading...${uploadProgress}%`);
        }
    });
    socket.on("drain", () => {
        fileReadStream.resume();
    })

    fileReadStream.on("end", () => {
        console.log("File was uploaded successfully!!");
        socket.end();
    });
});


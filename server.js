const net = require("net");
const fs = require("fs/promises");
const PORT = 3890;

const server = net.createServer();

server.on("connection", async (socket) => {
    console.log("New Connection!");
    let fileHandle, fileWriteStream;

    socket.on("data", async (chunk) => {

        if (!fileHandle) {
            socket.pause(); // pause for a while for file to open

            const indexOf_hyphen = chunk.indexOf("----------");
            const fileName = chunk.subarray(10, indexOf_hyphen).toString("utf-8");

            fileHandle = await fs.open(`storage/${fileName}`, "w");
            fileWriteStream = fileHandle.createWriteStream();
            fileWriteStream.write(chunk.subarray(indexOf_hyphen + 10));

            socket.resume(); // resume again to receive next chunk of data

            fileWriteStream.on("drain", () => {
                socket.resume();
            })
        }
        else {
            if (fileWriteStream.write(chunk) === false) {
                socket.pause();
            }
        }

    });
    socket.on("end", () => {
        fileHandle.close();
        socket.end();
        fileHandle = undefined;
        fileWriteStream = undefined;
        console.log("Connection Ended!");
    });

});

server.listen(PORT, "::1", () => {
    console.log("File Uploader server started at: ", server.address());
})
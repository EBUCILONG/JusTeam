var express = require("express");
var app = express();


app.use("/api",require("./Router/api"));

//test fileUpload
app.get("/pic", function(req,res) {
    res.write('<html><body><form action="api/posts/upload/pictures" method="post"enctype="multipart/form-data"><label for="file">Filename:</label><input type="file" name="image"><br><input type="submit" name="submit" value="Submit"></form></body></html>');
    res.end();
});

app.get("/art", function(req,res) {
    res.write('<html><body><form action="api/posts/upload/articles" method="post"enctype="multipart/form-data"><label for="file">Filename:</label><input type="file" name="article"><br><input type="submit" name="submit" value="Submit"></form></body></html>');
    res.end();
});

app.listen(3000);
console.log("Server started on port 3000.");

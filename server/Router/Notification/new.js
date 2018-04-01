var router = require("express").Router();
var notiInterface = require("../../NotificationSystem/RouterInterface")

router.get("/content", async (req, res, next) => {
    var userID = req.user.id;
    var response = await notiInterface.getNewNotification(userID);
    res.send(response);
});

router.get("/number", async(req,res,next)=> {
    var userID = req.user.id;
    var response = await notiInterface.getNumberOfNewNotification(userID);
    res.send(response);
});

module.exports = router;

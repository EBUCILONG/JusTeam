const express = require('express');
const bodyParser = require('body-parser');
const notiOP = require('../../NotificationSystem/NotificationSystem')
const teamOP = require('../../TeamSystem/teamOperation');
const eventOP = require('../../TeamSystem/eventOperation');
const accountOP = require('../../AccountSystem/entity/information');


var router = express.Router();



router.post('/createTeam',bodyParser.urlencoded({extended: true}),async (req,res)=>{
  var userID = req.user.id;
  var body = req.body;
  body.maxMember = parseInt(body.maxMember);
  teamOP.createTeam(body,(err,result)=>{
    if(err) {
      var a = {state: 'fail'};
      res.send(a);
    }
    else{
      accountOP.addTeam(result,req.user.id);
      var jsIn = {userID : userID, teamID : result};
      teamOP.addMember(jsIn, (err,result)=>{
        var editJs = {userID : userID, teamID : jsIn.teamID, newRight: 3};
        if(err){
          var a = {state: 'fail'};
          res.send(a);
        }
        else{
          teamOP.editAuthority(editJs,(err,result)=>{
            if(err){
              var a = {state: 'fail'};
              res.send(a);
            }
            else{
              var a = {state: 'success', insertId: jsIn.teamID};
              res.send(a);
            }
          });
        }
      });
    }
  });
});

router.get('/deleteTeam',async (req,res)=>{
  var userID = req.user.id;
  var deleteId = parseInt(req.query.teamID);
  var deletedTeam =undefined;
  var memberList = undefined;
  function askOnce(teamID){
    return new Promise((resolve,reject)=>{
      teamOP.askTeam(teamID,(err,result,fields)=>{
        if(err){
          reject(err);
        }
        else{
            console.log(result);
          deletedTeam = result;
          memberList = result.memberList;
          resolve();
        }
      });
    });
  }
  async function f(){
    try{
      await askOnce(deleteId);
      await new Promise((resolve,reject)=>{
        teamOP.deleteTeam(deleteId,(err,result)=>{
          if(err){
            reject(err);
          }
          resolve();
        });
      });
    }
    catch(e){
      var result = {state : 'fail'};
      res.send(result);
    }
  }
  await f();

  //TODO: need to implement delete teamID from the teamList in an account; dl();
  console.log(deletedTeam);
  var list = deletedTeam.memberList.IDList;
  for(var j = 0; j < list.length ; j++){
    await accountOP.deleteTeam(deleteId,list[j]);
    console.log('once delete yu xuan');
  }



  var notification = new notiOP.TeamPublicMessage(deleteId, req.user.id ,deletedTeam.teamTitle + ' has been deleted');
  var users = deletedTeam.memberList.IDList;
  notification.send(users,(err)=>{
    console.log(err);
  });

  //TODO: delete all the post attach to a team

  eventOP.deleteEventByTeam(deletedTeam.teamID,(err,result)=>{
    if(err) {
      var a = {state : 'fail'};
      res.send(a);
    }
    else{
      var a = {state : 'success'};
      res.send(a);
    }
  });
});

router.post('/editTeam', bodyParser.urlencoded({extended: true}), async (req,res)=>{
  var teamNew = req.body;
  console.log(req.body);
  teamNew.maxMember = parseInt(teamNew.maxMember);
  teamNew.teamID = parseInt(teamNew.teamID);
  var userID = req.user.id;
  teamOP.editTeam(teamNew, async (err,result)=>{
    if(err){
      var a = {state : 'fail'};
      res.send(a);
    }
    else{
      var a = {state : 'success'};
      var notification = new notiOP.TeamPublicMessage(teamNew.teamID, req.user.id, 'team information has been edited');
      var users = undefined;

      async function f(){
        await new Promise((resolve,reject)=>{
          teamOP.askTeam(teamNew.teamID,async (err,result)=>{
            if(!err){
              users = result.memberList.IDList;
              notification.send(users,(err)=>{
                console.log(err);
              });
              resolve()
            }
            resolve();
          });
        });
      }
      await f();

      res.send(a);
    }
  });
});

router.get('/addMember',async (req,res)=>{

  var aimTeamID = parseInt(req.query.teamID);
  var newMember = parseInt(req.query.newMember);
  var jsIn = {teamID : aimTeamID, userID : newMember};
  teamOP.addMember(jsIn, async (err,result)=>{
    if(err){
      console.log(err);
      var a = {state : 'fail'};
      res.send(a);
    }
    else{

    await accountOP.addTeam(aimTeamID, newMember);
      var newMembers = [];
      newMembers.push(newMember);
      var notification = new TeamMemberUpdate(aimTeamID,newMembers,[]);
      var users = undefined;
      async function f(){
        await new Promise((resolve,reject)=>{
          teamOP.askTeam(aimTeamID,(err,result)=>{
            if(!err){
              users = result.memberList.IDList;
              notification.send(users,(err)=>{
                console.log(err);
              });
              resolve();
            }
            resolve();
          });
        });
      }
      await f();

      var a = {state: 'success'};
      res.send(a);
    }
  });
});

router.get('/deleteMember',async (req,res)=>{
  var aimTeamID = parseInt(req.query.teamID);
  var quitedMember = parseInt(req.query.deletedMember);
  var jsIn = {teamID : aimTeamID, userID : quitedMember};
  teamOP.deleteMember(jsIn, async (err,result)=>{
    if(err){
      console.log(err);
      var a = {state : 'fail'};
      res.send(a);
    }
    else{
        await accountOP.deleteTeam(quitedMember, aimTeamID);

      var quitedMembers = [];
      quitedMembers.push(deletedMember);

      var notification = new TeamMemberUpdate(aimTeamID,[],quitedMembers);
      var users = undefined;
      async function f(){
        await new Promise((resolve,reject)=>{
          teamOP.askTeam(aimTeamID,async (err,result)=>{
            if(!err){
              users = result.memberList.IDList;
              notification.send(users,(err)=>{
                console.log(err);
              });
              resolve();
            }
            resolve();
          });
        });
      }
      await f();

      var a = {state: 'success'};
      res.send(a);
    }
  });
});

router.get('/editAuthority',async (req,res)=>{
  var aimUser = parseInt(req.query.userToChange);
  var changingRight = parseInt(req.query.rightToChange);
  var changingTeam = parseInt(req.query.teamID);
  var jsIn = {teamID : changingTeam, userID : aimUser, newRight : changingRight};
  console.log(jsIn);
  //edit authority input interface : {teamID: integer, userID : integer, newRight: integer}
  teamOP.editAuthority(jsIn, async (err, result)=>{
    if(err){
      console.log(err);
      var a = {state : 'fail'};
      res.send(a);
    }
    else{
      var a = {state : 'success'};

      var notification = new TeamPublicMessage(changingTeam,req.user.id,'the authority of one of your teammates has been changed');
      var users = undefined;
      async function f(){
        await new Promise((resolve,reject)=>{
          teamOP.askTeam(changingTeam, async (err,result)=>{
            if(!err){
              users = result.memberList.IDList;
              notification.send(users,(err)=>{
                console.log(err);
              });
              resolve();
            }
            resolve();
          });
        });
      }
      await f();

      res.send(a);
    }
  });
});

module.exports = router;
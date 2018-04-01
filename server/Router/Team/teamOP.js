const express = require('express');
const bodyParser = require('body-parser');
const notiOP = require('../../NotificationSystem/NotificationSystem')
const teamOP = require('../../TeamSystem/teamOperation');
const eventOP = require('../../TeamSystem/eventOperation');
const accountOP = require('../../AccountSystem/entity/information');


var router = express.Router();



router.post('/createTeam',bodyParser.urlencoded({extended: true}),(req,res)=>{
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

router.get('/deleteTeam',(req,res)=>{
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
        });
      });
    }
    catch(e){
      var result = {state : 'fail'};
      res.send(result);
    }
  }
  f();


  //TODO: need to implement delete teamID from the teamList in an account; dl();
  var list = deletedTeam.memberList.IDlist;
  for(var j = 0; j < list.length - 1; j++){
    accountOP.deleteTeam(deleteID,req.IDlist[j]);
  }



  var notification = new notiOP.TeamPublicMessage(deleteID, req.user.id ,deletedTeam.teamTitle + ' has been deleted');
  var users = deletedTeam.memberList.IDlist;
  notification.send(users,(err)=>{
    console.log(err);
  });

  //TODO: delete all the post attach to a team

  eventOP.deleteEventByTeam(deleteTeam.teamID,(err,result)=>{
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

router.post('/editTeam', bodyParser.urlencoded({extended: true}), (req,res)=>{
  var teamNew = req.body;
  console.log(req.body);
  teamNew.maxMember = parseInt(teamNew.maxMember);
  teamNew.teamID = parseInt(teamNew.teamID);
  var userID = req.user.id;
  teamOP.editTeam(teamNew,(err,result)=>{
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
          teamOP.askTeam(teamNew.teamID,(err,result)=>{
            if(!err){
              users = result.memberList.IDlist;
              notification.send(users,(err)=>{
                console.log(err);
              });
              resolve()
            }
            resolve();
          });
        });
      }
      f();

      res.send(a);
    }
  });
});

router.get('/addMember',(req,res)=>{

  var aimTeamID = parseInt(req.query.teamID);
  var newMember = parseInt(req.query.newMember);
  var jsIn = {teamID : aimTeamID, userID : newMember};
  teamOP.addMember(jsIn, (err,result)=>{
    if(err){
      console.log(err);
      var a = {state : 'fail'};
      res.send(a);
    }
    else{
      var newMembers = [];
      newMembers.push(newMember);
      var notification = new TeamMemberUpdate(aimTeamID,newMembers,[]);
      var users = undefined;
      async function f(){
        await new Promise((resolve,reject)=>{
          teamOP.askTeam(aimTeamID,(err,result)=>{
            if(!err){
              users = result.memberList.IDlist;
              notification.send(users,(err)=>{
                console.log(err);
              });
              resolve();
            }
            resolve();
          });
        });
      }
      f();

      var a = {state: 'success'};
      res.send(a);
    }
  });
});

router.get('/deleteMember',(req,res)=>{
  var aimTeamID = parseInt(req.query.teamID);
  var quitedMember = parseInt(req.query.deletedMember);
  var jsIn = {teamID : aimTeamID, userID : quitedMember};
  teamOP.deleteMember(jsIn, (err,result)=>{
    if(err){
      console.log(err);tea
      var a = {state : 'fail'};
      res.send(a);
    }
    else{
      var quitedMembers = [];
      quitedMembers.push(deletedMember);

      var notification = new TeamMemberUpdate(aimTeamID,[],quitedMembers);
      var users = undefined;
      async function f(){
        await new Promise((resolve,reject)=>{
          teamOP.askTeam(aimTeamID,(err,result)=>{
            if(!err){
              users = result.memberList.IDlist;
              notification.send(users,(err)=>{
                console.log(err);
              });
              resolve();
            }
            resolve();
          });
        });
      }
      f();

      var a = {state: 'success'};
      res.send(a);
    }
  });
});

router.get('/editAuthority',(req,res)=>{
  var aimUser = parseInt(req.query.userToChange);
  var changingRight = parseInt(req.query.rightToChange);
  var changingTeam = parseInt(req.query.teamID);
  var jsIn = {teamID : changingTeam, userID : aimUser, newRight : changingRight};
  console.log(jsIn);
  //edit authority input interface : {teamID: integer, userID : integer, newRight: integer}
  teamOP.editAuthority(jsIn, (err, result)=>{
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
          teamOP.askTeam(changingTeam,(err,result)=>{
            if(!err){
              users = result.memberList.IDlist;
              notification.send(users,(err)=>{
                console.log(err);
              });
              resolve();
            }
            resolve();
          });
        });
      }
      f();

      res.send(a);
    }
  });
});

module.exports = router;
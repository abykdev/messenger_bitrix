class User {
    constructor(obParams){
        this.ID=obParams.ID;
        this.HOST=obParams.HOST;
        this.res=obParams.res;
    }
    sendEvent(strEvent,obData){
        if(this.res){
            const strResText=`event: ${strEvent}\ndata: ${JSON.stringify(obData)}\n\n`;
            this.res.write(strResText);
            console.log("send event to:",this.ID);
            console.log("send event data:",strResText);
        }
    }
}

class Users {
    constructor(){
        this.Items=[]
    }
    add(obUserParams){
        this.Items.push(new User(obUserParams))
    }
    getByHost(strHost){
        let obHostUsers=new Users();
        this.Items.forEach((obUser)=>{
            if(obUser.HOST==strHost){
                obHostUsers.add(obUser);
            }
        });
        return obHostUsers;
    }
    isAdded(obUserCheck){
        let bResult=false;
        this.Items.forEach((obUser)=>{
            if(obUser.HOST==obUserCheck.HOST&&obUser.ID==obUserCheck.ID){
                bResult=true;
            }
        });
        return bResult;
    }
    sendEvent(strEvent,obData){
        console.log("attempt to send message to users:",this.toArrayExt());
        this.Items.forEach((obUser)=>{
            obUser.sendEvent(strEvent,obData)
        });
    }
    toArray(){
        let arUsersIds=[];
        this.Items.forEach((obUser)=>{
            arUsersIds.push(obUser.ID)
        });
        return arUsersIds;
    }
    toArrayExt(){
        let arUsersExt=[];
        this.Items.forEach((obUser)=>{
            arUsersExt.push({ID:obUser.ID,HOST:obUser.HOST})
        });
        return arUsersExt;
    }
    deleteUser(obUserDelete){
        console.log("will delete user:",obUserDelete);
        this.Items=this.Items.filter((obUser)=>{
            return !(obUser.HOST==obUserDelete.HOST&&obUser.ID==obUserDelete.ID)
        });

        console.log("Users after delete:",this.Items)
    }
    getUser(obUserSearch){
        console.log("Try to find user:",obUserSearch);
        console.log("Among users:",this.toArrayExt());
        let obUserFound={};
        this.Items.forEach((obUser,intIndex)=>{
            if(obUser.HOST==obUserSearch.HOST&&obUser.ID==obUserSearch.ID){
                obUserFound=obUser;
                console.log("User found!:",obUserFound);
            }
        });
        return obUserFound;
    }
}
module.exports ={User,Users}

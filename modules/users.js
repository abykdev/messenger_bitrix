class User {
    constructor(obParams){
        this.ID=obParams.ID;
        this.HOST=obParams.HOST;
    }
}

class Users {
    constructor(){
        this.Items=[]
    }
    add(obUserParams){
        this.Items.push(new User(obUserParams))
    }

}
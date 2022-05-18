const firstRound = require("./cartridges/map.json")
const AttackParser = require("./AttackParser")
//----Command Parser, getting the first part of the input command since that will contain the player's intended action----
module.exports = class CommandParser{
    constructor (lastSafe, bonusDef,bonusHP, bonusPhy,bonusMag,thisPlayer, playersThatVoted,command, scenes, check1,cS2, cS3, cS4,cS5,cS6, scene, voteToMove, directions, numOfPlayers, stats, moves, specialUsed, inventory, vamps, vampH, wolves, wolfH, alpha,alphaH, sirens,sirenH, dragon,dragonH){
        this.lastSafe = lastSafe
        this.bonusDef = bonusDef
        this.bonusHP =bonusHP
        this.bonusPhy = bonusPhy
        this.bonusMag = bonusMag
        this.Player = thisPlayer
        this.pTV = playersThatVoted
        this.command = command
        this.scenes = scenes
        this.check1 = check1
        this.cS2 = cS2
        this.cS3 = cS3
        this.cS4 = cS4
        this.cS5 = cS5
        this.cS6 = cS6
        this.scene = scene
        this.voteToMove = voteToMove
        this.directions = directions
        this.numOfPlayers = numOfPlayers
        this.playerStats = stats
        this.playerMoves = moves
        this.turnsSinceSpecial = specialUsed
        this.numToReturn = 0
        this.inventory = inventory
        this.vamps = vamps
        this.vampH = vampH
        this.wolves = wolves
        this.wolfH = wolfH
        this.alpha = alpha
        this.alphaH = alphaH
        this.sirens = sirens
        this.sirenH = sirenH
        this.dragon = dragon
        this.dragonH = dragonH
    }
    normalizeAction(strAct){
        let act = strAct.toLowerCase().split("-")[0] //intended action
        let direction = strAct.toLowerCase().split("-")[1] //direction/who is being attacked
        if(act=="attack"||act=="use"){
            return strAct.toLowerCase().split("-")
        }
        return [act, direction]
    }
    
    updateMove(direction){
            if((this.scene==2&&this.vamps<5)||(this.scene==3&&this.wolves<5)||(this.scene==5&&this.sirens<7)||(this.scene==6&&this.alpha<1)){
                return false;
            }
            if(!this.pTV.includes(this.Player)&&this.voteToMove+1<this.numOfPlayers){
                console.log(this.scene, this.voteToMove+1, this.numOfPlayers, "less than")
                this.directions.push(direction)
                this.pTV.push(this.Player)
                return [this.scene, this.voteToMove+1, 1, this.directions, this.pTV, this.cS2, this.cS3, this.cS4, this.cS5,this.bonusDef,this.bonusHP,this.bonusPhy,this.bonusMag, this.lastSafe]
            }
            if(!this.pTV.includes(this.Player)&&this.voteToMove+1==this.numOfPlayers){
                console.log(this.scene+1, 0, "equal to")
                this.numToReturn = this.scene
                let directionN = this.directions.filter(dir => dir=="north").length
                let directionE = this.directions.filter(dir=>dir=="east").length
                let directionS = this.directions.filter(dir => dir=="south").length
                let directionW = this.directions.filter(dir=>dir=="west").length
                let majorityVote = Math.max(directionN, directionE, directionS, directionW)
                if(this.scene==0){
                    this.numToReturn = this.scene+1
                }
                if(this.scene==1){
                    if(direction=="west"&&directionW==majorityVote)
                        this.numToReturn = this.scene+2
                    else
                        this.numToReturn = this.scene+1
                    this.lastSafe = 1
                }
                else if(this.scene==2){
                    if(direction=="east"&&directionE==majorityVote){
                        this.numToReturn = this.scene+2
                    }
                    else if (direction=="north"&&directionN==majorityVote){
                        this.numToReturn = this.scene+3
                    }
                    else{
                        this.numToReturn = this.scene-1
                    }
                    this.cS2 = true
                    this.lastSafe = 2
                    console.log("cS2", this.cS2)
                }
                else if(this.scene==3){
                    if(direction=="west"&&directionW==majorityVote){
                        this.numToReturn = this.scene+3
                    }
                    else if(direction == "east"&&directionE==majorityVote){
                        this.numToReturn = this.scene-2
                    }
                    else{
                        this.numToReturn = this.scene+4
                    }
                    this.cS3 = true
                    this.lastSafe = 3
                }
                else if(this.scene==4){
                    this.numToReturn = this.scene-2
                    this.bonusPhy = 6
                    this.lastSafe = 4
                }
                else if(this.scene==5){
                    if(direction=="south"&&directionS==majorityVote){
                        this.numToReturn = this.scene-3
                    }
                    else{
                        this.numToReturn = this.scene+3
                    }
                    this.cS4 = true
                    this.lastSafe = 5
                }
                else if(this.scene==6){
                    if(direction=="north"&&directionN==majorityVote){
                        this.numToReturn = this.scene+4
                    }
                    else{
                        this.numToReturn = this.scene-3
                    }
                    this.cS5 = true
                    this.lastSafe = 6
                }
                else if(this.scene==7){
                    this.numToReturn = this.scene-4
                    this.bonusHP = 15
                    this.lastSafe = 7
                }
                else if(this.scene==8){
                    if(direction=="east"&&directionE==majorityVote){
                        this.numToReturn = this.scene-3
                    }
                    else if(direction=="west"&&directionW==majorityVote){
                        this.numToReturn = this.scene+1
                    }
                    else{
                        this.numToReturn = this.scene+3
                    }
                    this.bonusMag = 7
                    this.lastSafe = 8
                }
                else if(this.scene==9){
                    if(direction=="east"&&directionE==majorityVote){
                        this.numToReturn = this.scene-1
                    }
                    else if(direction=="west"&&directionW==majorityVote){
                        this.numToReturn = this.scene+1
                    }
                    else{
                        this.numToReturn = this.scene+2
                    }
                    this.lastSafe = 9
                }
                else if(this.scene==10){
                    if(direction=="east"&&directionE==majorityVote){
                        this.numToReturn = this.scene-1
                    }
                    else{
                        this.numToReturn = this.scene-4
                    }
                    this.bonusDef = 10
                    this.lastSafe = 10
                }
                console.log("numToReturn: ", this.numToReturn, this.cS2, this.cS3, this.cS4, this.cS5)
                return [this.numToReturn, 0, 1, [],[], this.cS2, this.cS3, this.cS4, this.cS5,this.bonusDef,this.bonusHP,this.bonusPhy,this.bonusMag, this.lastSafe]
            }
            return false;
    }
    updatePickup(object){
        if(object=="stones"||object=="rubble"||object == "rocks"){
            return [this.scene, object, 2, true, "has explored", this.cS2, this.cS3, this.cS4, this.cS5,this.bonusDef,this.bonusHP,this.bonusPhy,this.bonusMag, this.lastSafe]
        }
        else if(object=="food"||object=="groceries"){
            return [this.scene, object,2,this.check1, "", this.cS2, this.cS3, this.cS4, this.cS5,this.bonusDef,this.bonusHP,this.bonusPhy,this.bonusMag, this.lastSafe]
        }
        else if(object=="rope"){
            return [this.scene, object, 2, this.check1, "", this.cS2, this.cS3, this.cS4, this.cS5,this.bonusDef,this.bonusHP,this.bonusPhy,this.bonusMag, this.lastSafe]
        }
    }
    parse(){
        //let setting = firstRound.rooms[this.scenes[this.scene]]
        //let defaultDescription = setting["description"]["default"]
        const validCommands = {0:{"move":["north"]}, 1:{"move":["east", "west"], "pickup": ["food", "rubble", "stones", "groceries", "rope", "rocks"], "drop":["food"], "eat":["food"]}, 2:{"move":["east","west","north"],"attack": ["vampire"], "use": ["rope", "food", "groceries","stones", "rocks", "rubble"]}, 3:{"move":["west","east","south"],"attack": ["werewolf", "wolf"], "use": ["rope", "food", "groceries","stones", "rocks", "rubble"]}, 4:{"move":["west"],"eat":["food"]}, 5:{"move":["south","west"],"attack": ["siren"], "use": ["rope", "food", "groceries","stones", "rocks", "rubble"]}, 6:{"move":["north","east"],"attack": ["alpha","werewolf","wolf"], "use": ["rope", "food", "groceries","stones", "rocks", "rubble"]},7:{"move":["north"],"eat":["food"]},8:{"move":["east","west","north"],"eat":["food"]},9:{"move":["east","west","north"],"eat":["food"]},10:{"move":["east","south"],"eat":["food"]},11:{"move":[],"attack": ["dragon"], "use": ["rope", "food", "groceries","stones", "rocks", "rubble"]}}
        
        let action = this.normalizeAction(this.command)
        console.log("Action: ", action, this.scene)
        let validity = validCommands[this.scene][action[0]]
        console.log("validity,", validity)
        if(validity){
        console.log("validity", this.scene, validity.includes(action[1]))
        if(action[0] == "move"&&validity.includes(action[1])){
            let updateAccordingly = this.updateMove(action[1]) //1 will be the code for moving
            return updateAccordingly 
        }
        else if(action[0]=="pickup"&&validity.includes(action[1])){
            let updateAccordingly = this.updatePickup(action[1]) //2 will be the code for picking up
            return updateAccordingly
        }
        else if((action[0] == "attack" && action[2] == "with")||(action[0]=="use" && action[2]=="on")&&action.length>=4){
            console.log("action: ", action)
            let attack = new AttackParser(action, this.numOfPlayers,this.playerMoves,this.turnsSinceSpecial, this.playerStats, this.inventory, this.scene, this.vamps,this.vampH, this.wolves, this.wolfH, this.alpha,this.alphaH, this.sirens,this.sirenH, this.dragon, this.dragonH);
            return attack.parse();//3 will be the code for attacking
        }   
        else{
            return false
        }
    }
    return false
    }
}
//----End of Command Parser----


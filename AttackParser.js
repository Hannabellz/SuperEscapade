module.exports = class AttackParser{
    constructor (action, numOfPlayers, playerMoves, turnsSinceSpecial, playerStats, playerInventory, scene, vamps,vampH, wolves,wolfH, alpha,alphaH, sirens,sirenH, dragon,dragonH){
        this.action = action
        this.numOfPlayers = numOfPlayers
        this.playerMoves = playerMoves
        this.turnsSinceSpecial = turnsSinceSpecial
        this.playerStats = playerStats
        this.playerInventory = playerInventory
        this.scene = scene
        this.vampsDef = vamps
        this.vampHealth = vampH
        this.wolvesDef = wolves
        this.wolfHealth = wolfH
        this.alphaDef = alpha
        this.alphaHealth = alphaH
        this.sirensDef = sirens
        this.sirenHealth = sirenH
        this.dragonDef = dragon
        this.dragonHealth = dragonH
        //have to add this.playerBoosts for different stats and utilize in calculations below
    }
    parseAttack(fullCommand){
        const moveTypesAndPower = {"Shred": ["Physical Attack",66], "Bleeding Heart": ["Magical Attack", 10], "Rattle": ["Physical Attack", 80], "Healing Hands": ["Magical Attack", 60], "On-Edge": ["Magical Attack", 20], "Freeze": ["Magical Attack", 0], "Flicker": ["Physical Attack", 45], "Ring of Fire": ["Magical Attack", 15], "Phoenix Pulse": ["Magical Attack", 95]}
        let attackWith = fullCommand[3]
        let attackDamage = 0
        let healing = false //if healing hands is used
        let onEdge = false //if on-edge (defense booster) is used
        //the following are considered "charged" moves, cannot be used multiple times in a row for player
        let rattle = false
        let freeze = false
        let phoenixpulse = false
        let message = ""
        console.log("attackWith: ", attackWith, fullCommand)
        if(attackWith=="stones"||attackWith=="rocks"||attackWith=="rubble"){
            if(this.playerInventory.includes(attackWith)){
                attackDamage = 7
            }
            else{
                message = "You did not pick up "+attackWith
            }
        }
        else if(attackWith=="attack 1"||attackWith=="1"){
            console.log("playerMoves: ",this.playerMoves)
            let thisPlayerAttack = this.playerMoves["Attack 1"]
            console.log("thisPlayerAttack: ",thisPlayerAttack)
            let moveInfo = moveTypesAndPower[thisPlayerAttack]
            console.log("moveInfo: ", moveInfo)
            let stat = moveInfo[0]
            let power = moveInfo[1]
            attackDamage = (this.playerStats[stat]/100) * power
            console.log(this.playerStats, stat, power, this.playerStats[stat],attackDamage)
            if(thisPlayerAttack == "Healing Hands"){
                healing = true
            }
            attackWith = thisPlayerAttack
        }
        else if(attackWith=="attack 2"||attackWith=="2"){
            let thisPlayerAttack = this.playerMoves["Attack 2"]
            let moveInfo = moveTypesAndPower[thisPlayerAttack]
            let stat = moveInfo[0]
            let power = moveInfo[1]
            if(thisPlayerAttack=="Bleeding Heart"||thisPlayerAttack=="Ring of Fire"){
                attackDamage = (this.playerStats[stat]/100) * power * this.numOfPlayers
            }
            else{
                attackDamage = (this.playerStats[stat]/100) * power * this.numOfPlayers
                onEdge = true
            }
            attackWith = thisPlayerAttack
        }
        else{
            console.log("turnsSince", this.turnsSinceSpecial)
            if(this.turnsSinceSpecial>=3){
                let thisPlayerAttack = this.playerMoves["Attack 3"]
                let moveInfo = moveTypesAndPower[thisPlayerAttack]
                let stat = moveInfo[0]
                let power = moveInfo[1]
                if(thisPlayerAttack == "Rattle" || thisPlayerAttack == "Phoenix Pulse"){
                    attackDamage = (this.playerStats[stat]/100) * power
                    if(thisPlayerAttack == "Rattle"){
                        rattle = true
                    }
                    else{
                        phoenixpulse = true
                    }
                }
                else{
                    freeze = true
                }
                attackWith = thisPlayerAttack
            }
            else{
                message = "You need more charge for this move."
            }
        }
        return [attackWith,attackDamage,3, healing, onEdge, rattle, freeze, phoenixpulse, message]
    }
    parseUse(fullCommand){
        let itemUsed = fullCommand[1]
        let attackDamage = 0
        let tied = false
        let message = ""
        if(itemUsed == "stones"||itemUsed=="rocks"||itemUsed=="rubble"||itemUsed =="food"||itemUsed=="groceries"){
            if(this.playerInventory.includes(itemUsed)){
                attackDamage = 7
            }
            else{
                message = "You did not pick up "+itemUsed
            }
        }
        else if(itemUsed == "rope"){
            if(this.playerInventory.includes(itemUsed)){
                tied = true
            }
            else{
                message = "You did not pick up "+itemUsed
            }
        }
        else{
            if(this.playerInventory.includes(itemUsed)){
                attackDamage = 10
            }
            else{
                message = "You did not pick up "+itemUsed
            }
        }
        return [itemUsed,attackDamage,3, tied, message]
    }
    parse(){
        const validAttacks = {2: {"attack": ["vampire"], "with": ["stones", "rocks", "rubble", "attack 1", "attack 2", "attack 3", "1", "2", "3"], "use": ["rope", "food", "groceries","stones", "rocks", "rubble"], "on": ["vampire"]},3: {"attack": ["werewolf", "wolf"], "with": ["stones", "rocks", "rubble", "attack 1", "attack 2", "attack 3", "1", "2", "3"], "use": ["rope", "food", "groceries","stones", "rocks", "rubble"], "on": ["werewolf","wolf"]},5: {"attack": ["siren"], "with": ["stones", "rocks", "rubble", "attack 1", "attack 2", "attack 3", "1", "2", "3"], "use": ["rope", "food", "groceries","stones", "rocks", "rubble"], "on": ["siren"]},6: {"attack": ["alpha","werewolf","wolf"], "with": ["stones", "rocks", "rubble", "attack 1", "attack 2", "attack 3", "1", "2", "3"], "use": ["rope", "food", "groceries","stones", "rocks", "rubble"], "on": ["alpha","werewolf","wolf"]},11: {"attack": ["dragon"], "with": ["stones", "rocks", "rubble", "attack 1", "attack 2", "attack 3", "1", "2", "3"], "use": ["rope", "food", "groceries","stones", "rocks", "rubble"], "on": ["dragon"]}}
        let action = this.action[0]
        let placement = this.action[2]
        console.log("bbbbbbbbbb",this.action,action, placement)
        if(action=="attack"){
            if(validAttacks[this.scene][action].includes(this.action[1])&&((this.action.length==4 &&validAttacks[this.scene][placement].includes(this.action[3]))||this.action.length==5&&validAttacks[this.scene][placement].includes(this.action[3].concat(" "+this.action[4])))){
                if(this.action.length==5)
                    this.action[3] = this.action[3].concat(" "+this.action[4])
                console.log("aaaaa: ", this.action)
                if((this.scene==2&&this.vampsDef!=5)||(this.scene==3&&this.wolvesDef!=5)||(this.scene==5&&this.sirensDef!=7)||(this.scene==6&&this.alphaDef!=1)||(this.scene==11&&this.dragonDef!=1))
                    return this.parseAttack(this.action)
            }
            return false;
        }
        else{
            if(validAttacks[this.scene][action].includes(this.action[1])&&validAttacks[this.scene][placement].includes(this.action[3])){
                if((this.scene==2&&this.vampsDef!=5)||(this.scene==3&&this.wolvesDef!=5)||(this.scene==5&&this.sirensDef!=7)||(this.scene==6&&this.alphaDef!=1)||(this.scene==11&&this.dragonDef!=1))
                    return this.parseUse(this.action)
            }
            return false;
        }
    }
}
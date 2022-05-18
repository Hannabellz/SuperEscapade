const path = require('path');
const bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const { MongoClient, ServerApiVersion } = require('mongodb');
//const uri = process.env.ATLAS_FINAL_URI;
const uri = "mongodb+srv://Hannabellz:04mAgHeK18@cluster0.zrfes.mongodb.net/final?retryWrites=true&w=majority"
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const CommandParser = require('./CommandParser')
const scenes = {0: "starting", 1: "explore1", 2: "vampires1", 3: "werewolves1", 4:"boostattack", 5:"sirens", 6:"alpha", 7:"boosthp", 8:"boostmag", 9:"rest", 10:"boostdef",11:"dragon"}
const firstRound = require("./cartridges/map.json")
const playerStats = {1:{"Physical Attack": 22, "Magical Attack": 11, "Defense": 15, "HP": 91}, 2:{"Physical Attack": 15, "Magical Attack": 18, "Defense": 20, "HP": 105}, 3:{"Physical Attack": 10, "Magical Attack": 25, "Defense": 15, "HP": 98}}
const playerMoves = {1: {"Attack 1": "Shred", "Attack 2": "Bleeding Heart", "Attack 3": "Rattle"}, 2: {"Attack 1": "Healing Hands", "Attack 2": "On-Edge", "Attack 3": "Freeze"}, 3: {"Attack 1": "Flicker", "Attack 2": "Ring of Fire", "Attack 3": "Phoenix Pulse"}}
var ObjectId = require('mongodb').ObjectId;
var _db;
async function getDb() {
    if (!_db) {
        await client.connect();
        _db = await client.db("final");
    }
    return _db;
}

function finalHome(req,res){
    res.render("home");
}
async function joiningGame(req,res){
    let db = await getDb()
    let users = db.collection("users")
    let userQuery = {"email": req.body.email}
    users.findOne(userQuery, async function(err, result){
        if(!result){
            console.log("pass: ", req.body.pass, req.body.email)
            let pass = await bcrypt.hash(req.body.pass,10)
            users.insertOne({email: req.body.email, password: pass, username: "", inventory:[], class: "2", damageTaken: 0, specialUsed: 0})
        }
        else{
            console.log("result: ", result);
            let pass = await bcrypt.compare(req.body.pass, result.password);
            if(!pass){
                res.send(`<p>Are you sure your email and password are correct? <a href = '/defenders'>Please try again.</a></p>`)
                return;
            }
        }
        res.send(`<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script><script>
        function setBubble(range, bubble) {
            const x = {1: "Cambion<br><br>A child of chaos and destruction and flesh, demon and human, soulless and soul...You admittedly found the ordeal amusing at first. It was when they kept coming through, kept disrupting without pulling any punches that you grew annoyed. Enraged at the audacity of these things to stumble upon your home, you grew (quietly) protective. You chalked it up to genuine aggression that would be took out upon things that deserved it. They would learn from their mistakes and repent for their sins...", 2: "Nephilim<br><br>A being born of the heavens and the world, you had nothing binding you here. Except...your likes, your friends, your lessons learned, and your overall love for this world. You didn't know what you would do without it- just thinking about it made a hole in your wonky soul. If it were to be driven into the ground, you were certain your wings would follow soon after, keeping you grounded...and bound. You had to take the preventative measures. You had to stop the monsters before they stopped everything to Hell.", 3:"Phoenix<br><br>You are one of those that made it through from purgatory earlier on, but you had not been tasked with destruction. You hadn't been tasked with anything! You wished to see new sights, and this world proved to be more colorful and hopeful than the last. Wanting to keep the spark alive and well meant preventing the others from putting it out. Thus, you assigned yourself as a defender, utilizing your abilities in ways you never had before.", 4: "Join a game!", 5: "Create a game!"}
            const val = range.value;
            bubble.innerHTML = x[val];
          }
          $(document).ready(function (){const allRanges = document.querySelectorAll(".range-wrap");
        allRanges.forEach(wrap => {
          const range = wrap.querySelector(".range");
          const bubble = wrap.querySelector(".bubble");
        
          range.addEventListener("input", () => {
            setBubble(range, bubble);
          });
          setBubble(range, bubble);
        });
        
        })</script><form action = "/createOrJoin" method="POST">
        Input your username: <input type = "text" name = "user">
        <br>
        <div class="range-wrap">
        Select your class! <input type = "range" class = "range" name = "class" min="1" max = "3">
        <output class = "bubble"></output>
        </div>
        <br>
        <div class = "range-wrap">
        <input type = "range" class = "range" name = "option" min="4" max = "5">
        <output class = "bubble"></output>
        </div>
        <input type = "hidden" name = "email" value = "${req.body.email}">
        <input type = "submit" name = "Continue" value = "Continue">
        </form>`) //I don't know why it never occurred to me that there was an output like there was an input, but
        //this was inspired by https://css-tricks.com/value-bubbles-for-range-inputs/ to display a value
        //based on the chosen value of a range. 
    })
}
async function createOrJoin(req,res){
    let db = await getDb()
    let users = db.collection("users")
    let games = db.collection("games")
    let safeInit = req.body.user
    if(safeInit.trim().length==0){
        safeInit = "Space"
    }
    let userQuery = {$set: {username: safeInit, class: req.body.class}}
    let coj = req.body.option
    users.findOneAndUpdate({email: req.body.email},userQuery, function(err, result1){
        if(coj==4){
            res.send(`<form action = "/joinGame" method = "POST">
            <input type = "hidden" name = "user" value = "${safeInit}">
            <input type = "hidden" name = "email" value = "${req.body.email}">
            Input the ID of the game you'd like to join: <input type = "text" name = "gameID">
            <input type = "submit" value = "Request Join!">
            </form>`)
        }
        else{
            users.findOne({email: req.body.email}, async function(err, result){
                let slightModification = result._id
                let countID = await games.countDocuments({gameID:slightModification})
                while(countID>0){
                    slightModification = new ObjectId(24)
                    countID = await games.countDocuments({gameID:slightModification})
                }
                games.insertOne({gameID:slightModification})
                res.send(`<form action = "/newGame/${slightModification}" method = "POST">
                <input type = "hidden" name = "user" value = "${safeInit}">
                <input type = "hidden" name = "email" value = "${req.body.email}">
                <input type = "hidden" name = "gameID" value = "${slightModification}">
                Create game with ID ${slightModification}:
                <input type = "submit" value = "Create Now!">`)
        })
        }
    })
    
}
async function joinRequest(req,res){
    let db = await getDb()
    let users = db.collection("users")
    let games = db.collection("games")
    let gameQuery = {gameID: new ObjectId("000000000000000000000000")};
    if(req.body.gameID.length==24&&!(!isNaN(req.body.gameID))){
        gameQuery = {gameID: new ObjectId(req.body.gameID)}
        console.log("gameQuery Updated: ", gameQuery)
    }
    games.findOne(gameQuery, function (err, result){
        if(!result){
            res.send(`This game ID does not exist! <br>
            <form action = "/createOrJoin" method = "POST">
            <input type = "hidden" name = "user" value = "${req.body.user}">
            <input type = "hidden" name = "email" value = "${req.body.email}">
            <input type = "hidden" name = "option" value = 4>
            <input type = "submit" value = "Double-check that you have the right one">
            </form>
            <form action = "createOrJoin" method = "POST">
            <input type = "hidden" name = "user" value = "${req.body.user}">
            <input type = "hidden" name = "email" value = "${req.body.email}">
            <input type = "hidden" name = "option" value = 5>
             <input type = "submit" value = "or create your own.">
             </form>`)
        }
        else{
            res.send(`Requested Game Found! <br>
            <form action = "/newGame/${req.body.gameID}" method = "POST">
            <input type = "hidden" name = "user" value = "${req.body.user}">
            <input type = "hidden" name = "email" value = "${req.body.email}">
            <input type = "submit" value = "Join Now!">
            </form>`)
        }
    })
}
async function renderGameState(req,res){
    let db = await getDb()
    let gameStates = db.collection("gameStates")
    let gameIDy = new ObjectId(req.params[0])
    gameStates.findOne({"gameID": gameIDy}, async function (err, result){
        if(!result){
            let defaultSetting = firstRound.rooms[scenes[0]]
            let description = defaultSetting["description"]["default"]
            let players = {}
            players[req.body.user]=req.body.email
            gameStates.insertOne({gameID: gameIDy, prompt: description, index:0, players:players,faintedPlayers:{}, playersVoted: [],voteToMove: 0, directions: [], bonusHP: 0, bonusDef: 0, bonusMag: 0, bonusPhy:0, check1: false,changedScene1: false,check2:false,changedScene2: false,check3:false,changedScene3: false,check4:false,changedScene4: false, check5:false,changedScene5: false,check6:false,changedScene6: false, vampiresDefeated: 0, vampireHealth: 50, werewolvesDefeated: 0, werewolfHealth: 50, alphaDefeated:0, alphaHealth: 100,sirensDefeated:0, sirenHealth: 70, dragonDefeated:0, dragonHealth: 300, lastSafe: 1}) 
            res.render("escapade", {gameID: gameIDy, prompt:description, thisUser: req.body.user, thisEmail: req.body.email})
        }
        if(result){
            console.log(result)
            if(!Object.values(result.players).includes(req.body.email)){
                result.players[req.body.user]= req.body.email
                await gameStates.updateOne({gameID: gameIDy}, {$set:{players:result.players}})
            }
            res.render("escapade", {gameID: gameIDy, prompt: result.prompt, thisUser: req.body.user, thisEmail: req.body.email})
        }
        
    })
}

async function getGame(req,res){
    let db = await getDb()
    let gameStates = db.collection("gameStates")
    let gameID = new ObjectId(req.params[0])
    gameStates.findOne({"gameID": gameID}, function(err, result){
        res.send(result)
    }
    )
}
function monster(sceneNum, thisUser, playerDef, creaturesData){
    //will return if the next monster in the lineup
    //is now the current, description/what their attacking line is, and the damage they will be dealing
    if(sceneNum==2){
        //vampires
        let numDef = creaturesData["vampires"][0]
        let currentCreatureHealth = creaturesData["vampires"][1]
        let attackList = [{"Lunge": 8}, {"Crackle": 10}, {"Feeding Frenzy":5*(5-numDef)}]
        let random = Math.floor(Math.random()*attackList.length)
        let chosenAttack = attackList[random]
        let name = Object.keys(chosenAttack)[0]
        let totalDamage = (50/playerDef) * Object.values(chosenAttack)[0]
        if(numDef<5&&currentCreatureHealth>0){
            return [false, `The vampire used ${name}, lashing its vicious fangs at ${thisUser}.`, totalDamage]
        }
        else if(numDef==0&&currentCreatureHealth<=0){
            return [true, `The next vampire looked as if no one had introduced them to sunscreen yet, nasty-looking burns covering splotches of skin. Much like their predecessor, their eyes were also red, and they made no hesitation in leaping towards ${thisUser}, using ${name} without so much as blinking.`, totalDamage]
        }
        else if(numDef==1){
            //second vampire defeated
            return [true, `Much unlike the first two, this one had eyes like a storm. And what you could only presume to be a bone in their hands crackled like lightning, an unamused gaze falling upon ${thisUser}. No- forget unamused- murderous. They looked inclined in fulfilling their intentions, discarding the bone and gunning straight towards ${thisUser}, using ${name}.`, totalDamage]
        }
        else if(numDef==2){
            //third vampire defeated
            return [true, `You would've been more inclined to think that the oncoming leech was a shifter; they looked and sounded completely animalistic. Their hair went in every direction, even standing up on its ends. Their nails were filed to more resemble claws, even their feet were bare to show off talon-like toenails. You could only hope ${thisUser} wouldn't be met with the nasty end of that short stick as the pale face used ${name}.`, totalDamage]
        }
        else if (numDef==3){
            //fourth vampire defeated
            return [true, `Watching brethren in blood fall one-by-one was not something this one seemed to be taking very well. He threw his head back and screamed, leaving your blood and bones rattling and shaking you to your core. He dashed straight towards ${thisUser} at break-neck speed, attacking with ${name}.`, totalDamage]
        }
        else if(numDef==4){
            //last vampire defeated, prompt to move onwards
            return [true, `Breathless. You felt absolutely breathless and worn down. If it wasn't for immediately feeling safer, you wouldn't have fallen to your knees as you had now. Before this, you hadn't used your abilities so heavily, and you certainly hadn't had to rely on them to survive in what you could only call a deathmatch. Looking around yourself now encouraged you to decide where to go from here. You could come back from where you started to the west to see if there was anything else. Or perhaps you should continue east, with the street ahead seeming oddly calmer since your victory. There was also a path northernward that was calling to you.`, -10]
        }
    }
    else if(sceneNum==3){
        //werewolves
        let numDef = creaturesData["werewolves"][0]
        let currentCreatureHealth = creaturesData["werewolves"][1]
        let attackList = [{"Bristle": 8}, {"Crunch": 10}, {"Jaw Breaker":10+(5*numDef)}]
        let random = Math.floor(Math.random()*attackList.length)
        let chosenAttack = attackList[random]
        let name = Object.keys(chosenAttack)[0]
        let totalDamage = (30/playerDef) * Object.values(chosenAttack)[0]
        if(numDef<5&&currentCreatureHealth>0){
            return [false, `The werewolf used ${name}, keeping close to ${thisUser}.`, totalDamage]
        }
        else if(numDef==0&&currentCreatureHealth<=0){
            return [true, `All you could see dashing towards you was a giant red flag that promised bloodshed. Literally- the wolf's fur was the perfect shade of blood, so much that you doubted it was natural. Was it possible for werewolves to dye their fur in Purgatory, or was it a recent development? ...Hopefully it was something like hair dye and not a result of them wrecking the town. There was a clear intent to add ${thisUser}'s blood to its coat as it used ${name}.`, totalDamage]
        }
        else if(numDef==1){
            //second wolf defeated
            return [true, `If any of the wolves in this crew had rabies, it would be this one. It may not have been foaming at the mouth, but it lacked any sense of tame or control that the previous two had. Its bark sounded as vicious as its bite looked, going directly towards ${thisUser} with Crunch.`, 10]
        }
        else if(numDef==2){
            //third wolf defeated
            return [true, `While the previous may have lacked control, this one certainly basked in true chaos. It made its movements unpredictable, although deliberately so. It had to have some cognition of what it was doing, and you figured this one's job was to make their prey confused. At the last possible moment it lurched towards ${thisUser}'s side to use ${name}.`, totalDamage]
        }
        else if (numDef==3){
            //fourth wolf defeated
            return [true, `Silence was the only true distinction of this one from the others. They had howled, an equivalent of whooping and hollering, whether it be while attacking or edging the others on. This one was completely quiet, even now. And in its silence, there was a challenge. Perhaps this was the last of them here, but there was no intent to go down without a fight. And if it could, it would be bringing you to Purgatory with it. Or at least was currently gunning for ${thisUser} with ${name}.`, totalDamage]
        }
        else if(numDef==4){
            //last wolf defeated, prompt to move onwards
            return [true, `As you looked down at your now torn skin and clothes, you further wished for it to prove worth it in the end. If you were successful, it most certainly would. And then you'd be able to retire to the knowledge you kept the world somewhat functioning, with the promise of being fixable. Things could be made from the ground up, just as they had originally. Looking around now, you could still picture how the building looked, how the streets looked. The hustle and bustle of people getting to where they need to go. Some of them were even smiling...You didn't want to think of where they all were now. But the passing consideration was enough to have you looking into the directions you could go now. There was the more wrecked route to the west, back towards where you originally began to the east, and a small area to the south.`, -10]
        }
    }
    else if(sceneNum==5){
        //sirens
        let numDef = creaturesData["sirens"][0]
        let currentCreatureHealth = creaturesData["sirens"][1]
        let attackList = [{"Foggy Lead": 12}, {"Daring Dive": 18}, {"The True Lullaby":7*(7-numDef)}]
        let random = Math.floor(Math.random()*attackList.length)
        let chosenAttack = attackList[random]
        let name = Object.keys(chosenAttack)[0]
        let totalDamage = (60/playerDef) * Object.values(chosenAttack)[0]
        if(numDef<7&&currentCreatureHealth>0){
            return [false, `The siren used ${name}, moving with deadly grace towards ${thisUser}.`, totalDamage]
        }
        else if(numDef==0&&currentCreatureHealth<=0){
            return [true, `Although they all could've very well looked the exact same, and it was what you had anticipated based on the first's, this siren had all the same features but none of equal stylings. She was a variant, a breakthrough of one being just as beautiful but in a starkly different way. All the way down to her snake-like eyes and the forked tongue that you were sure had to be venomous. Just based on your luck alone. There was no reluctance in her movements to reach ${thisUser}.`, totalDamage]
        }
        else if(numDef==1){
            //second siren defeated
            return [true, `You were curious as to how long this one had actually been left undetected by you, for her gray skin made her look more like a statue than something alive, even now as she waltzed towards you. Everything to her was composed of varying shades of gray, and the fog warping around you even shifted to match. Confident lips forced into a smile to show jagged, shark-like teeth. She zoned in on ${thisUser} at the last possible moment before launching herself towards them.`, totalDamage]
        }
        else if(numDef==2){
            //third siren defeated
            return [true, `Colors, vibrant and dull, and most consisting of ones you had never seen before. Even the hair that sprung from her head was inconsistent with each strand, the color of her irises their own sea that you could get hypnotized should you stare for too long. You could see what resembled veins covering the lengths of her arms, but even those shifted ever few moments. You could never be sure what you were staring at, and perhaps that was the point. To distract until she was attacking ${thisUser}.`, totalDamage]
        }
        else if (numDef==3){
            //fourth siren defeated
            return [true, `Fog swirled around them, covering them like the clothing on their back. If you had to guess, this was the main source of the fog of the area, for evry bit around you started to twist and turn. It had the same affect of standing in the waves of an ocean, making you feel like you were moving when you were certain you were standing still. With each of their steps, more fog exuded from their fingertips, their barefeet a ghostly pale. You couldn't distinguish what was cloud and what was them. All that you could be certain of was their milky white eyes that held all and no emotion. The next moment, they were completely enveloped in fog, only to reappear behind ${thisUser}.`, totalDamage]
        }
        else if (numDef==4){
            //fifth siren defeated
            return [true, `The surroundings grew to be more visible, and you were left in the company of two remaining sirens. The one closest had earrings that surpassed even the length of her hair, which spiked up towards the top. A lot of her features seemed pointed- her nose, her ears, the shoes she wore that seemed to match the throwing knife she twirled impatiently in her hand. There was no doubt in your mind that the shoes could hurt as much as the blatant weapon, though you doubted she needed either. With deadly precision she flicked the dagger out and away from her, straight towards ${thisUser}.`, totalDamage]
        }
        else if (numDef==5){
            //sixth siren defeated
            return [true, `The last one standing made no immediate moves, even as the last of their presumed crew fell flat and faded away at your feet. Their dark complexion combined with their silver, shimmering eyes offered a sight that could've brought any tired traveler to the brink. You imagined this was the one that had caused most ships from older times to wreck, the one that heroes in myths heard and screamed and shouted to reach. Even you, after fighting off six already, questioned if it was necessary to defeat a seventh. You could fall back into what you felt in the very beginning- secure, comfort, and all tensions departing from you. But then they dashed at ${thisUser} with wicked speed, bringing them both down to the ground. And you relievingly broke out of the trance again, ready to send them along with the rest of their friends.`, totalDamage]
        }
        else if(numDef==6){
            //last siren defeated, prompt to move onwards
            return [true, `As the final strike was dealt, you crumpled to the ground as your final foe did. Luckily, you didn't fade away like them, but you felt extremely worn down. Like you were pushing against water that pulled, fighting every inch of an invisible current. Everything was sore- even your mind felt worn down. Apparently it wasn't so simple to fight off their call. You weren't sure whether to chalk it up to adrenaline or your otherworldly abilities, but whatever it was, you were grateful. The realization that dawned on you for just how warped reality had felt, how trapped you had felt, was enough to keep you on the ground. It was more comfortable than you ever remembered it being...For now, you just allowed yourself to breathe. There wasn't any moment to take for granted.<br><br>Whenever you were ready, there was the west and the south to venture to.`, -10]
        }
    }
    else if(sceneNum==6){
        //alpha
        let numDef = creaturesData["alpha"][0]
        let currentCreatureHealth = creaturesData["alpha"][1]
        let attackList = [{"Crush": 12}, {"Trample": 14}, {"Vengeance":29}]
        let random = Math.floor(Math.random()*attackList.length)
        let chosenAttack = attackList[random]
        let name = Object.keys(chosenAttack)[0]
        let totalDamage = (55/playerDef) * Object.values(chosenAttack)[0]
        if(numDef==0&&currentCreatureHealth>0){
            return [false, `The alpha used ${name}, relentlessly attacking ${thisUser}.`, totalDamage]
        }
        else if(numDef==0&&currentCreatureHealth<=0){
            return [true, `All of the pressure that you had previously underwent left you in a hurry, just as any and all of what you recently ate did from your stomach. In the moment, you were grateful it was now rather than when the almighty alpha was alive, for your pride's sake mostly. The wolf would've thought you an easy pick out from the crowd, if it hadn't thought that before. Gravely mistaken, you monstrosity, right to your grave. In the very least, all around, you now felt all the better. Hungry, but improved. The wear and tear was gruesome, but it was in everyone's best interest to trudge on at some point. From here, it was only the north and the east, the former feeling its own different brand of terrible.`, -20]
        }
    }
    else if(sceneNum==11){
        //dragon
        let numDef = creaturesData["dragon"][0]
        let currentCreatureHealth = creaturesData["dragon"][1]
        let attackList = [{"Fiery Surge": 15}, {"Crashing Wave": 15}, {"Haywire Voltage":15},{"Continental Drift": 20}]
        let random = Math.floor(Math.random()*attackList.length)
        let chosenAttack = attackList[random]
        let name = Object.keys(chosenAttack)[0]
        let totalDamage = (100/playerDef) * Object.values(chosenAttack)[0]
        if(numDef==0&&currentCreatureHealth>0){
            return [false, `The dragon used ${name}, aiming straight at ${thisUser}.`, totalDamage]
        }
        else if(numDef==0&&currentCreatureHealth<=0){
            return [true, `As gracefully as deadweight could fall, the massive scaley creature fell. The earth itself quaked and waved, feeling like water underneath your feet. The fire lessened to be about as tall as you. It took longer for the dragon to disappear completely, but it happened all at once. All it did was make it feel all the more like a nightmare. If not for the clear evidence that it happened, you wouldn't have believed it was more than a dream.<br><br>But wouldn't that be nice on its own? For this all to be false, for everything to still be alright. For everyone to still be alright.<br><br>But not all happy endings include everyone they should. But is that to say that there should be no happy ending to work towards? It may not be the happiest, but it's less gloomy and hopeless than before.<br><br>At least, in what's left in your hometown.`, totalDamage]
        }
    }
}
async function parsingComm(req,res){
    console.log(req.params[0])
    let gameIDy = new ObjectId(req.params[0].split('/')[1])
    let parsed = req.params[0].split('/')[0]
    let thisUser = req.params[0].split('/')[2]
    let thisEmail = req.params[0].split('/')[3]
    let stats = {}
    let moves = {}
    let inventory = []
    let inventoryCheck = true
    console.log("thisUser: ", thisUser)
    let db = await getDb()
    let gameStates = db.collection("gameStates")
    let users = db.collection("users")
    users.findOne({email: thisEmail}, function(err, result){
        console.log("class: ", result.class, "inventory: ", result.inventory)
        stats = playerStats[result.class]
        moves = playerMoves[result.class]
        inventory = result.inventory
        gameStates.findOne({gameID: gameIDy}, async function(err, gSresult){
            console.log("length", Object.keys(gSresult.players).length)
            let parsing = new CommandParser(gSresult.lastSafe,gSresult.bonusDef,gSresult.bonusHP,gSresult.bonusPhy,gSresult.bonusMag,thisEmail, gSresult.playersVoted, parsed, scenes, gSresult.check1,gSresult.changedScene2,gSresult.changedScene3,gSresult.changedScene4,gSresult.changedScene5,gSresult.changedScene6, gSresult.index, gSresult.voteToMove, gSresult.directions,Object.keys(gSresult.players).length, stats, moves,result.specialUsed, inventory, gSresult.vampiresDefeated, gSresult.vampireHealth, gSresult.werewolvesDefeated, gSresult.werewolfHealth, gSresult.alphaDefeated, gSresult.alphaHealth, gSresult.sirensDefeated, gSresult.sirenHealth,gSresult.dragonDefeated,gSresult.dragonHealth)
            let commandObj = parsing.parse()
            console.log("gsssss:", gSresult.changedScene2)
            console.log("commandObj: ", commandObj)
            if(commandObj){
                let boostedDef = gSresult.bonusDef
                let boostedHP = gSresult.bonusHP
                let boostedPhy = gSresult.bonusPhy
                let boostedMag = gSresult.bonusMag
                let lastSafe = gSresult.lastSafe
                let sceneNum = gSresult.index
                let voteToNum = gSresult.voteToMove
                let direction = gSresult.directions
                let actNum = commandObj[2]
                let check1 = gSresult.check1
                let check2 = gSresult.check2
                let check3 = gSresult.check3
                let check4 = gSresult.check4
                let check5 = gSresult.check5
                let check6 = gSresult.check6
                //checking if the scene has changed since corresponding checks
                let changedScene1 = gSresult.changedScene1
                let changedScene2 = gSresult.changedScene2
                let changedScene3 = gSresult.changedScene3
                let changedScene4 = gSresult.changedScene4
                let changedScene5 = gSresult.changedScene5
                let changedScene6 = gSresult.changedScene6
                //
                let conditional = ""
                let object = ""
                let vampiresDef = gSresult.vampiresDefeated
                let thisVampHealth = gSresult.vampireHealth
                let werewolvesDef = gSresult.werewolvesDefeated
                let thisWolfHealth = gSresult.werewolfHealth
                let alphaDef = gSresult.alphaDefeated
                let thisAlphaHealth = gSresult.alphaHealth
                let sirensDef= gSresult.sirensDefeated
                let thisSirenHealth = gSresult.sirenHealth
                let dragonDef = gSresult.dragonDefeated
                let thisDragonHealth = gSresult.dragonHealth
                let playersThatVoted = gSresult.playersVoted
                let special = result.specialUsed
                let monsterAttack = ""
                if(actNum==1){
                    sceneNum = commandObj[0]
                    voteToNum = commandObj[1]
                    direction = commandObj[3]
                    playersThatVoted = commandObj[4]
                    changedScene2 = commandObj[5]
                    changedScene3 = commandObj[6]
                    changedScene4 = commandObj[7]
                    changedScene5 = commandObj[8]
                    boostedDef = commandObj[9]
                    boostedHP = commandObj[10]
                    boostedPhy = commandObj[11]
                    boostedMag = commandObj[12]
                    lastSafe = commandObj[13]
                }
                if(actNum==2){
                    sceneNum =commandObj[0]
                    object = commandObj[1]
                    check1 = commandObj[3] //right now is only for the first pickup conditional, may have to alter slightly later
                    conditional = commandObj[4]
                    if(!inventory.includes(object)){
                        inventory.push(object)
                        inventoryCheck = false
                    }
                    changedScene2 = commandObj[5]
                    changedScene3 = commandObj[6]
                    changedScene4 = commandObj[7]
                    changedScene5 = commandObj[8]
                    await users.updateOne({email: thisEmail}, {$set:{inventory:inventory}})
                }
                if(actNum==3){
                    
                    let faintedPlayers = gSresult.faintedPlayers
                    let playerDef = stats["Defense"]
                    //users are attacking/using items on enemies
                    //will either send [item attacked with, the damage, 3, booleans for special moves, and message if they do not have ITEM being attacked with]
                    //or [item they used, the damage, 3, boolean for being tied, or message if they did not have the ITEM being used]
                    if(Object.keys(faintedPlayers).length==Object.keys(gSresult.players).length){
                        let defaultSetting = firstRound.rooms[scenes[gSresult.lastSafe]]
                        let description = defaultSetting["description"]["conditionals"]["has fainted"]
                        for(let email of Object.values(gSresult.players)){
                            let userQuery = {$set: {damageTaken: 0}}
                            users.findOneAndUpdate({email: email},userQuery)
                        }
                        await gameStates.updateOne({gameID: gameIDy},{$set:{prompt: description,faintedPlayers: {}, index: gSresult.lastSafe, changedScene1:(!gSresult.lastSafe==1&&changedScene1), changedScene2: (!gSresult.lastSafe==2&&changedScene2), changedScene3:(!gSresult.lastSafe==3&&changedScene3), changedScene4: (!gSresult.lastSafe==4&&changedScene4), changedScene5: (!gSresult.lastSafe==5&&changedScene5), changedScene6: (!gSresult.lastSafe==6&&changedScene6)}});
                        return;
                    }
                    if(!Object.values(faintedPlayers).includes(thisEmail)){

                    if(commandObj.length==5){
                        //item is being used
                        if(commandObj[4]==""){
                            //they do have the item
                            let item = commandObj[0]
                            let damageDealt = commandObj[1]
                            let tied = commandObj[3]
                            inventory.pop(item)
                            if(sceneNum==2){
                                thisVampHealth -= damageDealt
                            }
                            else if(sceneNum==3){
                                thisWolfHealth-=damageDealt
                            }
                            else if(sceneNum==5){
                                thisSirenHealth-=damageDealt
                            }
                            else if(sceneNum==6){
                                thisAlphaHealth-=damageDealt
                            }
                            else if(sceneNum==11){
                                thisDragonHealth-=damageDealt
                            }
                            if(!tied){
                                let random = Math.floor(Math.random() * Object.keys(gSresult.players).length)
                                let userToAttack = Object.keys(gSresult.players)[random]
                                let callTo = monster(sceneNum, userToAttack, playerDef, {"vampires": [vampiresDef, thisVampHealth], "werewolves": [werewolvesDef, thisWolfHealth], "alpha": [alphaDef, thisAlphaHealth], "sirens": [sirensDef, thisSirenHealth], "dragon": [dragonDef, thisDragonHealth]})
                                let oneDef = callTo[0]
                                monsterAttack = callTo[1]
                                let damageTaken = callTo[2]
                                await users.updateOne({email: thisEmail}, {$set:{inventory:inventory}})
                                if(damageTaken>0)
                                    await users.updateOne({email: gSresult.players[userToAttack]}, {$inc:{damageTaken:damageTaken}})
                                else{
                                    for(let email of Object.values(gSresult.players)){
                                        let userQuery = {$inc: {damageTaken: -10}}
                                        users.findOneAndUpdate({email: email},userQuery)
                                    }
                                }
                                if(oneDef){
                                    if(sceneNum==2){
                                        vampiresDef+=1
                                        thisVampHealth=50
                                        check2 = (damageTaken<0)
                                    }
                                    else if(sceneNum==3){
                                        werewolvesDef+=1
                                        thisWolfHealth=50
                                        check3 = (damageTaken<0)
                                    }
                                    else if(sceneNum==5){
                                        sirensDef+=1
                                        thisSirenHealth=70
                                        check4 = (damageTaken<0)
                                    }
                                    else if(sceneNum==6){
                                        alphaDef+=1
                                        check5 = (damageTaken<0)
                                    }
                                    else if(sceneNum==11){
                                        dragonDef+=1
                                        check6 = (damageTaken<0)
                                    }
                                }
                                //user query for userToAttack, user query for inventory use
                            }
                        }
                        else{
                            await gameStates.updateOne({gameID: gameIDy},{$set:{prompt: commandObj[4]}});
                            return;
                        }
                    }
                    else{
                        //attack
                        if(commandObj[8]==""){
                            let attackedWith = commandObj[0]
                            let damageDealt = commandObj[1]
                            let healingHandsUsed = commandObj[3]
                            let onEdgeUsed = commandObj[4]
                            let rattleUsed = commandObj[5]
                            let freezeUsed = commandObj[6]
                            let phoenixPulseUsed = commandObj[7]
                            if (attackedWith=="stones"||attackedWith=="rocks"||attackedWith=="rubble"){
                                inventory.pop(attackedWith)
                            }
                            if(sceneNum==2){
                                thisVampHealth -= damageDealt
                            }
                            else if(sceneNum==3){
                                thisWolfHealth-=damageDealt
                            }
                            else if(sceneNum==5){
                                thisSirenHealth-=damageDealt
                            }
                            else if(sceneNum==6){
                                thisAlphaHealth-=damageDealt
                            }
                            else if(sceneNum==11){
                                thisDragonHealth-=damageDealt
                            }
                            if(rattleUsed||freezeUsed||phoenixPulseUsed){
                                special = 0 
                                console.log("special :)")
                            }
                            if(onEdgeUsed){
                                let totalTurnDef = stats["Defense"]
                                users.findOne({email: thisEmail}, function(err, resultEd){
                                    console.log("class: ", resultEd.class, "inventory: ", resultEd.inventory)
                                    let bodef = boostedDef
                                    totalTurnDef = totalTurnDef*1.2 + bodef
                                })
                                let callTo = monster(sceneNum, thisUser, totalTurnDef, {"vampires": [vampiresDef, thisVampHealth], "werewolves": [werewolvesDef, thisWolfHealth], "alpha": [alphaDef, thisAlphaHealth], "sirens": [sirensDef, thisSirenHealth], "dragon": [dragonDef, thisDragonHealth]})
                                let oneDef = callTo[0]
                                monsterAttack = callTo[1]
                                let damageTaken = callTo[2]
                                console.log("check2 = ", check2, damageTaken)
                                if(damageTaken>0)
                                    await users.updateOne({email: thisEmail}, {$inc:{damageTaken:damageTaken}})
                                else{
                                    for(let email of Object.values(gSresult.players)){
                                        let userQuery = {$inc: {damageTaken: -10}}
                                        users.findOneAndUpdate({email: email},userQuery)
                                    }
                                }
                                if(oneDef){
                                    if(sceneNum==2){
                                        vampiresDef+=1
                                        thisVampHealth=50
                                        check2 = (damageTaken<0)
                                    }
                                    else if(sceneNum==3){
                                        werewolvesDef+=1
                                        thisWolfHealth=50
                                        check3 = (damageTaken<0)
                                    }
                                    else if(sceneNum==5){
                                        sirensDef+=1
                                        thisSirenHealth=70
                                        check4 = (damageTaken<0)
                                    }
                                    else if(sceneNum==6){
                                        alphaDef+=1
                                        check5 = (damageTaken<0)
                                    }
                                    else if(sceneNum==11){
                                        dragonDef+=1
                                        check6 = (damageTaken<0)
                                    }
                                }
                            }
                            if(!freezeUsed&&!onEdgeUsed){
                                let random = Math.floor(Math.random() * Object.keys(gSresult.players).length)
                                let userToAttack = Object.keys(gSresult.players)[random]
                                console.log(userToAttack, random,gSresult.players)
                                let callTo = monster(sceneNum, userToAttack, playerDef, {"vampires": [vampiresDef, thisVampHealth], "werewolves": [werewolvesDef, thisWolfHealth], "alpha": [alphaDef, thisAlphaHealth], "sirens": [sirensDef, thisSirenHealth], "dragon": [dragonDef, thisDragonHealth]})
                                let oneDef = callTo[0]
                                monsterAttack = callTo[1]
                                let damageTaken = callTo[2]
                                if(healingHandsUsed){
                                    damageTaken-= (damageTaken*.2)
                                }
                                await users.updateOne({email: thisEmail}, {$set:{inventory:inventory}})
                                if(damageTaken>0)
                                    await users.updateOne({email: gSresult.players[userToAttack]}, {$inc:{damageTaken:damageTaken}})
                                else{
                                    for(let email of Object.values(gSresult.players)){
                                        let userQuery = {$inc: {damageTaken: -10}}
                                        users.findOneAndUpdate({email: email},userQuery)
                                    }
                                }
                                if(oneDef){
                                    if(sceneNum==2){
                                        vampiresDef+=1
                                        thisVampHealth=50
                                        check2 = (damageTaken<0)
                                    }
                                    else if(sceneNum==3){
                                        werewolvesDef+=1
                                        thisWolfHealth=50
                                        check3 = (damageTaken<0)
                                    }
                                    else if(sceneNum==5){
                                        sirensDef+=1
                                        thisSirenHealth=70
                                        check4 = (damageTaken<0)
                                    }
                                    else if(sceneNum==6){
                                        alphaDef+=1
                                        check5 = (damageTaken<0)
                                    }
                                    else if(sceneNum==11){
                                        dragonDef+=1
                                        check6 = (damageTaken<0)
                                    }
                                }
                            }
                        }
                        else{
                            await gameStates.updateOne({gameID: gameIDy},{$set:{prompt: commandObj[8]}});
                            return;
                        }
                        special+=1;
                        console.log("special: ", special)
                        await users.updateOne({email: thisEmail}, {$set:{inventory:inventory, specialUsed:special}})
                    }
                
                    let userLine = `${thisUser} used ${commandObj[0]}!<br><br>`
                    console.log("about to update", check2)
                    if(!Object.values(faintedPlayers).includes(thisEmail)){
                        if(result.damageTaken>=stats["HP"]+gSresult.bonusHP){
                            faintedPlayers[thisUser] = [thisEmail]
                        }
                    }
                    await gameStates.updateOne({gameID: gameIDy},{$set:{prompt: userLine.concat(monsterAttack),faintedPlayers:faintedPlayers,check2:check2,check3:check3,check4:check4,check5:check5,check6:check6, vampiresDefeated: vampiresDef, vampireHealth: thisVampHealth, werewolvesDefeated: werewolvesDef, werewolfHealth: thisWolfHealth, alphaDefeated:alphaDef, alphaHealth: thisAlphaHealth,sirensDefeated:sirensDef, sirenHealth: thisSirenHealth, dragonDefeated:dragonDef, dragonHealth: thisDragonHealth}})
                    return;
                }
                else{
                    await gameStates.updateOne({gameID: gameIDy}, {$set:{prompt: `${thisUser} has been knocked out for this battle.`}})
                }
                }
                console.log("sceneNum, voteToNum", sceneNum, voteToNum)
                let defaultSetting = firstRound.rooms[scenes[sceneNum]]
                let description = defaultSetting["description"]["default"]
                if(actNum==2&&(!inventoryCheck)){
                    description = thisUser + ` picked up ${object}!<br><br>`+description
                }
                else if((sceneNum==2&&check2&&!changedScene2)||(sceneNum==3&&check3&&!changedScene3)||(sceneNum==5&&check4&&!changedScene4)||(sceneNum==6&&check5&&!changedScene5)){
                    description = gSresult.prompt
                }
                console.log(check1, "checkity check")
                if(check1&&sceneNum==1){
                    console.log("default", defaultSetting)
                    description = defaultSetting["description"]["conditionals"]["has explored"]
                    if(actNum==2&&(!inventoryCheck)){
                        description = thisUser + ` picked up ${object}!<br><br>`+description
                    }
                }
                else if(check2&&sceneNum==2&&changedScene2){
                    description = defaultSetting["description"]["conditionals"]["has beaten"].concat("<br><br>There were three paths to take: the west, the east, and the north.")
                }
                else if(check3&&sceneNum==3&&changedScene3){
                    description = defaultSetting["description"]["conditionals"]["has beaten"]
                }
                else if(check4&&sceneNum==5&&changedScene4){
                    description = defaultSetting["description"]["conditionals"]["has beaten"]
                }
                else if(check5&&sceneNum==6&&changedScene5){
                    description = defaultSetting["description"]["conditionals"]["has beaten"]
                }
                else if(check6&&sceneNum==11&&changedScene6){
                    description = defaultSetting["description"]["conditionals"]["has beaten"]
                }
                else if(sceneNum==4&&boostedPhy>0){
                    description = defaultSetting["description"]["conditionals"]["has explored"]
                }
                else if(sceneNum==7&&boostedHP>0){
                    description = defaultSetting["description"]["conditionals"]["has explored"]
                }
                else if(sceneNum==7||sceneNum==9){
                    let userQuery = {$mul: {damageTaken: 1/3}} //1/3 of original damage
                    for(let email of Object.values(gSresult.players)){
                        users.findOneAndUpdate({email: email},userQuery)
                    }
                }
                else if(sceneNum==8&&boostedMag>0){
                    description = defaultSetting["description"]["conditionals"]["has explored"]
                }
                else if(sceneNum==4&&boosted10>0){
                    description = defaultSetting["description"]["conditionals"]["has explored"]
                }
                console.log("description: ", description)
                console.log("cssss: ", changedScene2)
                if(actNum!=3){
                    await gameStates.updateOne({gameID: gameIDy}, {$set:{prompt:description, voteToMove: voteToNum,playersVoted: playersThatVoted, index: sceneNum, directions: direction, check1: check1,changedScene2:changedScene2,changedScene3:changedScene3,changedScene4:changedScene4,changedScene5:changedScene5,changedScene6:changedScene6,bonusDef: boostedDef, bonusHP: boostedHP, bonusPhy: boostedPhy, bonusMag: boostedMag}})
                    if(actNum==1){
                        await gameStates.updateOne({gameID: gameIDy}, {$set:{faintedPlayers:{}, lastSafe:lastSafe}})
                    }
                }
            }
        })
    
    })
    res.send();
}

async function parsingView(req, res){
    let db = await getDb()
    let users = db.collection("users")
    let gameStates = db.collection("gameStates")
    let parsing = req.params[0].split('/')[0]
    let thisUser = req.params[0].split('/')[1]
    let thisEmail = req.params[0].split('/')[2]
    let thisGame = new ObjectId(req.params[0].split('/')[3])
    console.log("parsingView", req.params[0], thisUser)
    let stats = {}
    let moves = {}
    let inventory = []
    users.findOne({email: thisEmail}, function(err, result){
        console.log("class: ", result.class, "inventory: ", result.inventory)
        stats = playerStats[result.class]
        moves = playerMoves[result.class]
        inventory = result.inventory
        gameStates.findOne({gameID: thisGame}, function(err, resultG){
            if(parsing == "inventory"){
                console.log("inventory: ", inventory, inventory.length)
                let toSend = ``
                for (let item = 0; item<inventory.length; item++){
                    toSend = toSend.concat(`<p>${inventory[item]}</p>`)
                    console.log("toSend in loop", toSend)
                }
                console.log("toSend", toSend)
                res.send(toSend)
            }
            else if(parsing == "moves"||parsing == "attacks"){
                console.log("moves", moves)
                res.send(`<p>Attack 1: ${moves["Attack 1"]}</p><p>Attack 2: ${moves["Attack 2"]}</p><p>Attack 3: ${moves["Attack 3"]}</p>`)
            }
            else{
                console.log("stats", stats, resultG)
                res.send(`<p>Physical Attack: ${stats["Physical Attack"]+resultG.bonusPhy}</p><p>Magical Attack: ${stats["Magical Attack"]+resultG.bonusMag}</p><p>Defense: ${stats["Defense"]+resultG.bonusDef}</p><p>HP: ${stats["HP"]+resultG.bonusHP-result.damageTaken}</p>`) 
            }
        })
    
    })
}

const express = require('express');
const { response } = require('express');
const { config } = require('process');
let router = express.Router();
router.get('/defenders', finalHome); //home page
router.post('/next', urlencodedParser,joiningGame);
router.post('/createOrJoin', urlencodedParser, createOrJoin)
router.post('/joinGame', urlencodedParser, joinRequest)
router.post('/newGame/*', urlencodedParser, renderGameState)
router.get('/game/*', getGame)
router.get('/parser/*', parsingComm)
router.get('/viewInfo/*', parsingView)
/*
//Game Routes
router.post('/defenders', urlencodedParser, makeGame); //create a new game ID, client app should be valid
router.post('/:id', urlencodedParser, joinGame); //join a game using username, create new game state object relating user and gameID
router.get('/:id/state/:playername', currGameState); //game state of a player for a specific game, including details of current scene
router.post('/:id/:playername/commands', urlencodedParser, interactGame); //interaction with a particular scene
function makeGame(req, res, next){
    let gameInfo = req.body
    const GameInstance = new (models.get('game'))(gameInfo)
    GameInstance.save((err, model)=>{
        console.log(err)
        if(err) return next(err)
        res.json(model)
    })
};
function joinGame(req, res, next){
    let playerInfo = req.body
    let joinModel = playerInfo
    joinModel.game = req.params.id

    const GameStateInstance = new(models.get('gameState'))(joinModel)

    GameStateInstance.save((err, model)=>{
        if(err){ 
            if(err.code ==11000) return next({ //error for duplicate users
                error: true,
                code: err.code,
                message: 'That user is already inside the game.'
            })
            return next(err)
        }
        res.json(model)
    })
};
function currGameState(req, res, next){
    let gameid = req.params.id
    let playername = req.params.playername

    models.get('gameState')
        .findOne({
            game: gameid,
            playername: playername
        })
        .populate('game')
        .exec((err, model)=>{
            if(err) return next(err)
            if(!model) return next({
                status: 404,
                message: `Game state for player ${playername} and Game ID: ${gameid} not found`
            })
            res.json(model)
        })
}
function interactGame(req, res, next){
    let command = req.body
    command.context = {
        gameId: req.params.id,
        playername: req.params.playername
    }

    let parser = new CommandParser(command)
    let commandObj = parser.parse()
    if(!commandObj) return next({
        status: 400,
        errorCode: config.get("errorCodes.invalidCommand"),
        message: "Unknown command"
    })
    commandObj.run((err, result)=>{
        if (err) return next(err)
        res.json(result)
    })
}

function interactWithScene(req,res,next){
    let command = req.body
    command.context = {
        gameId: req.params.id,
        playername: req.params.playername,
    }
    let parser = new CommandParser(command)
    let commandObj = parser.parse() //will either be false or a valid command object
    if(!commandObj) return next({ //user command error
        status: 400, 
        errorCode: config.get("errorCodes.invalidCommand"),
        message: "Unknown command"
    })
    commandObj.run((err, result)=>{ //for valid user command
        if(err) return next(err)
        res.json(result)
    })
}
router.post('/:id/:playername/:scene',urlencodedParser, interactWithScene)*/
module.exports = router;
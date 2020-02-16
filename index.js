const express = require("express");
const redis = require("redis");
const fetch = require('node-fetch')
const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379; // setup redis port


// create redisClient
const client = redis.createClient(REDIS_PORT);
const app = express();


//setup response 
let sendResponse = (username,repos) => {
    return `<h1>${username.toUpperCase()} Has ${repos} github repose</h1>`
}


//make request to github
let getUserRepos = async (req,res)=> {
    try {
        console.log("Making Request");
        let {username} = req.params;
        let response = await fetch(`https://api.github.com/users/${username}`);
        let data = await response.json();
        let repos = data.public_repos
       
        //setup redis which takes in 3 value 1.key  2.expiration date 3.value
        client.setex(username,3600,repos)
        res.status(200).send(sendResponse(username,repos))
    }catch(err) {
        console.log(err);
        res.status(500).send(err);
    }
}

let cache = (req,res,next) => {
    let {username} = req.params;
    client.get(username,(err,data)=> {
        if(err) throw err;

        if(data !== null) {
            console.log("getting from cache")
            res.status(200).send(sendResponse(username,data))
        }
        else {
            next()
        }
    })
}

app.get("/:username",cache,getUserRepos);

app.listen(PORT,()=> {
    console.log(`App is running on port ${PORT}`)
})
import express from 'express';

// install v2 node-fetch@2
import fetch from 'node-fetch';
// const {redis, createClient} = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

// const client = createClient({ legacyMode: true });
import { createClient } from 'redis';

const client = createClient({legacyMode: true});

await client.connect();

const app = express();

// Set response
function setResponse(username, repos) {
    return `<h2>${username} has ${repos} Github repos</h2>`
} 

// Make request to github for data
async function getRepos(req, res, next) {

    try {
        console.log('Fetching Data...');

        const { username } = req.params;

        const response = await fetch(`https://api.github.com/users/${username}`)

        const data = await response.json();

        const repos = data.public_repos;

        // Set data to Redis
        client.setEx(username, 3600, repos);

        res.send(setResponse(username, repos));

    } catch (err) {
        console.log(err);
        res.status(500);
    }
}

// Cache middleware
function cache(req, res, next) {
    const { username } = req.params;

    client.get(username, (err, data) => {
        if (err) throw err;

        if (data !== null) {
            res.send(setResponse(username, data));
        } else {
            next();
        }
    })
}
 
app.get('/repos/:username', cache, getRepos);

app.listen(5000, () => {
    console.log(`App listening on port ${PORT}`);
});
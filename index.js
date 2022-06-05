const { Telegraf } = require('telegraf');
const axios = require("axios");
const express = require("express");


const bot = new Telegraf("5099926432:AAFwgjzeIcxlj76-qEGIkOiBO4jNjyw-WSI");

const app = express();

var botusername = null;

app.get("/", (req, res) => {
    res.send("Bor is live :)");
});

bot.telegram.getMe().then((data) => {
    botusername = data.username;
});

async function check_is_joined(chat_id) {
    return new Promise((resolve, reject) => {
        bot.telegram.getChatMember(-1001698777076, chat_id).then((grp1) => {
            if (grp1.status === "left") {
                resolve(false);
                return;
            }
            bot.telegram.getChatMember(-1001668301785, chat_id).then((grp2) => {
                if (grp2.status === "left") {
                    resolve(false);
                    return;
                }

                resolve(true);
            }).catch(() => {
                resolve(false);
            })

        }).catch(() => {
            resolve(false);
        });
    });
}


bot.on("inline_query", async (ctx) => {


    if (!ctx.inlineQuery.query.length) {
        ctx.answerInlineQuery([]);
        return;
    }

    if (ctx.inlineQuery.chat_type !== "sender") {
        let empty_res = [{
            type: "article",
            id: String(0),
            title: "Oops! Please Search in bot chat",
            input_message_content: { message_text: `<b>404 Not Found !</b>`, parse_mode: "html" },
            thumb_url: "https://www.publicdomainpictures.net/pictures/280000/velka/not-found-image-15383864787lu.jpg",
            description: `You have to search in bot only please click the button at the top at "Click here to search in bot chat" :/`
        }];

        ctx.answerInlineQuery(empty_res, { is_personal: true, cache_time: 1, switch_pm_text: "Click here to search in bot chat", switch_pm_parameter: "query" }).catch(()=>{});
        return;
    }


    const init = async (is_member) => {
        try {
            let make_results = [];

            let bd = await axios({
                method: "GET",
                url: `https://fmdbbot.blogspot.com/feeds/posts/default?alt=json&q=${encodeURIComponent(ctx.inlineQuery.query)}`,
                timeout: 1800
            });

            if (bd.data.feed.hasOwnProperty("entry")) {
                make_results = bd.data.feed.entry.map((item) => {
                    item = JSON.parse(item.content["$t"]);
                    let send_d = {
                        type: "article",
                        id: String(item.id),
                        title: `${item.title}〔 ${item.year.match(/[0-9]{1,4}/g)[0]} 〕 ✓ `,
                        input_message_content: { message_text: `<pre>You will receive message from bot please wait</pre>`, parse_mode: "html", disable_web_page_preview: true },
                        thumb_url: item.poster,
                        description: `${item.imdb}\t【 ${item.type.toUpperCase()} 】\n${item.genre.replace(/,/g, " ● ")}`

                    };

                    if (!is_member) {
                        send_d.input_message_content.message_text = `<b>Kindly Join This Both Channels to use this bot Because bot may be not work for long time so Join this for more stuff.</b>\n\n<b><a href="https://t.me/+HEVScJr_AqZhOGFh">https://t.me/+HEVScJr_AqZhOGFh</a></b>\n\n<b><a href="https://t.me/+f2OtF0Hv8VY1ZTRh">https://t.me/+f2OtF0Hv8VY1ZTRh</a></b>`;
                        delete send_d["reply_markup"];
                    }


                    return send_d;
                });
            }

            //console.log(make_results);

            if (!make_results.length) {
                let res = await axios({
                    method: "GET",
                    url: `https://www.omdbapi.com/?s=${encodeURIComponent(ctx.inlineQuery.query)}&apikey=ea9a6089`,
                    timeout: 1800
                });


                if (res.data.hasOwnProperty("Response") && res.data.Response != "False") {
                    // console.log(res.data);
                    make_results = res.data.Search.map((item, index) => {
                        if (item.Poster.includes("http")) {
                            let send_d = {
                                type: "article",
                                id: String(item.imdbID),
                                title: `${item.Title}〔 ${item.Year.match(/[0-9]{1,4}/g)[0]} 〕`,
                                input_message_content: { message_text: `<pre>You will receive message from bot please wait</pre>`, parse_mode: "html", disable_web_page_preview: true },
                                thumb_url: item.Poster,
                                description: `${item.Type} ● ${item.imdbID}`,
                                url: `https://www.imdb.com/title/${item.imdbID}`

                            };

                            if (!is_member) {
                                send_d.input_message_content.message_text = `<b>Kindly Join This Both Channels to use this bot Because bot may be not work for long time so Join this for more stuff.</b>\n\n<b><a href="https://t.me/+HEVScJr_AqZhOGFh">https://t.me/+HEVScJr_AqZhOGFh</a></b>\n\n<b><a href="https://t.me/+f2OtF0Hv8VY1ZTRh">https://t.me/+f2OtF0Hv8VY1ZTRh</a></b>`;
                                delete send_d["reply_markup"];
                            }


                            return send_d;
                        }
                        return;
                    });
                }
            }



            make_results = make_results.filter(item => item);
            if (!make_results.length) {
                throw new Error(ctx.inlineQuery.query);
            }

            ctx.answerInlineQuery(make_results, { is_personal: true, cache_time: 1 }).catch(()=>{});

        } catch (error) {
            let make_results = [{
                type: "article",
                id: String(0),
                title: "Oops! Not Found",
                input_message_content: { message_text: `<b>404 Not Found !</b>`, parse_mode: "html" },
                thumb_url: "https://www.publicdomainpictures.net/pictures/280000/velka/not-found-image-15383864787lu.jpg",
                description: `"${error.message}" is not found please make sure you are searching right thing :/`
            }];

            ctx.answerInlineQuery(make_results, { is_personal: true, cache_time: 1 }).catch(()=>{});
        }
    }

    let condi = await check_is_joined(ctx.inlineQuery.from.id);
    init(condi);


});

bot.on("chosen_inline_result", async (ctx) => {
    let condi = await check_is_joined(ctx.chosenInlineResult.from.id);
    if (!condi) {
        console.log(condi);
        return;
    }

    try {

        if (ctx.chosenInlineResult.result_id.includes("fmdb")) {
            let bd = await axios({
                method: "GET",
                url: `https://fmdbbot.blogspot.com/feeds/posts/default/-/${ctx.chosenInlineResult.result_id}?max-results=1&alt=json&start=1`,
                timeout: 1800
            });


            if (bd.data.feed.hasOwnProperty("entry")) {
                let item = JSON.parse(bd.data.feed.entry[0].content["$t"]);

                bot.telegram.sendPhoto(ctx.chosenInlineResult.from.id, item.poster, {
                    caption: `<strong><pre>${item.title}</pre></strong>\n\n<b>ɪᴍᴅʙ : </b><pre>${item.imdb}</pre>\t\t\t\t\t\t<b>ᴛʏᴘᴇ : </b><pre>${item.type.toUpperCase()}</pre>\n\n<b>ʀᴇʟᴇᴀsᴇᴅ ᴏɴ - </b><pre>${item.released_on}</pre>\n<b>ɢᴇɴʀᴇ - </b><pre>${item.genre}</pre>\n<b>ᴀᴄᴛᴏʀs - </b><pre>${item.actors}</pre>\n<b>ᴅɪʀᴇᴄᴛᴏʀ - </b><pre>${item.director}</pre>`,
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Download & Wacth Online", url: item.url }],
                            [{ text: "Search another", switch_inline_query_current_chat: "" }]
                        ]
                    }
                });
                return;
            }
        }




        let res = await axios({
            method: "GET",
            url: `https://www.omdbapi.com/?i=${ctx.chosenInlineResult.result_id}&plot=short&apikey=ea9a6089`,
            timeout: 1800
        });
        //\n\n<i><pre>${res.data.Plot}</pre></i>
        bot.telegram.sendPhoto(ctx.chosenInlineResult.from.id, res.data.Poster, {
            caption: `<strong><pre>${res.data.Title}</pre></strong>\n\n<b>ɪᴍᴅʙ : </b><pre>${res.data.imdbRating}</pre>\t\t\t\t\t\t<b>ᴛʏᴘᴇ : </b><pre>${res.data.Type.toUpperCase()}</pre>\n\n<b>ʀᴇʟᴇᴀsᴇᴅ ᴏɴ - </b><pre>${res.data.Released}</pre>\n<b>ɢᴇɴʀᴇ - </b><pre>${res.data.Genre}</pre>\n<b>ᴀᴄᴛᴏʀs - </b><pre>${res.data.Actors}</pre>\n<b>ᴅɪʀᴇᴄᴛᴏʀ - </b><pre>${res.data.Director}</pre>`,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Read More..", url: `https://www.imdb.com/title/${ctx.chosenInlineResult.result_id}` }],
                    [{ text: "Search another", switch_inline_query_current_chat: "" }]

                ]
            }
        });

    } catch (error) {

    }


});


bot.start((ctx) => {
    ctx.reply(`<b>☲ FMDB BOT ☲</b>\n\n<b>● Disclaimer ●</b>\n<i>All Links and Data which we are providing is free avialable on Internet we are only indexing them in one place.</i>\n\n<b><i>How to use ● Type below full text in any chat</i>\n\n<b>@${botusername} <pre>type_search_query</pre></b></b>`, {
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [{ text: "Click here for Search", switch_inline_query_current_chat: "money heist" }]
            ]
        }
    });
});

app.listen(process.env.PORT || 8000, (error) => {
    if (error) return;
    console.log(`Server Runinng on Port : `, process.env.PORT || 8000);
});

//bot.launch();

// app.use(bot.webhookCallback("/bot"));
// bot.telegram.setWebhook("https://fmdbdev.herokuapp.com/bot");

(async ()=>{
    let res = await axios({
        method: "GET",
        url: `https://www.omdbapi.com/?i=tt12032938&plot=short&apikey=ea9a6089`,
        timeout: 1800
    });
    //\n\n<i><pre>${res.data.Plot}</pre></i>
    bot.telegram.sendPhoto("@muddy_movie_2021", res.data.Poster, {
        caption: `<strong><pre>${res.data.Title}</pre></strong>\n\n<b>ɪᴍᴅʙ : </b><pre>${res.data.imdbRating}</pre>\t\t\t\t\t\t<b>ᴛʏᴘᴇ : </b><pre>${res.data.Type.toUpperCase()}</pre>\n\n<b>ʀᴇʟᴇᴀsᴇᴅ ᴏɴ - </b><pre>${res.data.Released}</pre>\n<b>ɢᴇɴʀᴇ - </b><pre>${res.data.Genre}</pre>\n<b>ᴀᴄᴛᴏʀs - </b><pre>${res.data.Actors}</pre>\n<b>ᴅɪʀᴇᴄᴛᴏʀ - </b><pre>${res.data.Director}</pre>\n\n<b>Please Download this Movie from bot - @fmdbbot</b>`,
        parse_mode: "HTML"
    });
    bot.telegram.sendPhoto(-1001698777076, res.data.Poster, {
        caption: `<strong><pre>${res.data.Title}</pre></strong>\n\n<b>ɪᴍᴅʙ : </b><pre>${res.data.imdbRating}</pre>\t\t\t\t\t\t<b>ᴛʏᴘᴇ : </b><pre>${res.data.Type.toUpperCase()}</pre>\n\n<b>ʀᴇʟᴇᴀsᴇᴅ ᴏɴ - </b><pre>${res.data.Released}</pre>\n<b>ɢᴇɴʀᴇ - </b><pre>${res.data.Genre}</pre>\n<b>ᴀᴄᴛᴏʀs - </b><pre>${res.data.Actors}</pre>\n<b>ᴅɪʀᴇᴄᴛᴏʀ - </b><pre>${res.data.Director}</pre>`,
        parse_mode: "HTML"
    });
})();

(async ()=>{
    const meta_name = (name)=>{
        let res = "";
        for(var i=1;i<=name.length;i++){
          res += name.substring(0,i) + ",";
        }
       return res;
    }

    let d = await axios({
        method: "GET",
        url: `https://www.omdbapi.com/?i=tt12032938&plot=short&apikey=ea9a6089`,
        timeout: 1800
    });
    
    let res = {
        "id": "fmdb02",
        "meta": meta_name(d.data.Title),
        "poster": d.data.Poster,
        "title": d.data.Title,
        "type": d.data.Type,
        "genre": d.data.Genre,
        "director": d.data.Director,
        "writer": d.data.Writer,
        "actors": d.data.Actors,
        "released_on": d.data.Released,
        "imdb": "N/A",
        "year": d.data.Year,
        "tags": "",
        "part": "1",
        "imdb_id": d.data.imdbID,
        "trailer": "https://www.youtube.com/embed/Mrn9YHahvbU",
        "plot": d.data.Plot,
        "data": [
            {
                "name": "hindilinks4u.to",
                "url": "https://www.hindilinks4u.to/kabir-singh-2019/",
                "links": [
                    "https://streamtape.com/v/m6GXm2aAG3hbokb"
                ]
            },
            {
                "name": "ssrmovies.com",
                "url": "https://www.ssrmovies.world/2019/09/kabir-singh-2019-hindi-proper-1080p-web-dl-x264-1-8gb-esubs.html",
                "links": [
                    "https://linkybox.xyz/view/OEPzehkTLHD9ws4em77q"
                ]
            },
            {
                "name": "Hdhub4u.ninja",
                "url": "https://www.ssrmovies.world/2019/09/kabir-singh-2019-hindi-proper-1080p-web-dl-x264-1-8gb-esubs.html",
                "links": [
                    "https://linkybox.xyz/view/OEPzehkTLHD9ws4em77q"
                ]
            }
        ]
    }

    console.log(JSON.stringify(res));
});
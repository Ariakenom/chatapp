chatbox = document.getElementById('chatbox');
changes = "";


// var updateInterval = window.setInterval(doUpdate, 200);

// async function doUpdate() {
//     // window.clearInterval(updateInterval);
//     if (changes!==""){
//         startChat = chatbox.value;
//         startChanges = changes;
//         changes = "";
//         response = await fetch("/chatbox.txt", {method: "POST", body: startChanges});
//         if (!response.ok) {
//             console.log(response);
//             alert(response);
//             return;
//         }
//         responseChat = await response.text();
//         chatbox.value = responseChat + changes;
//     }
// }

// chatbox.addEventListener('input', async event => {
//     console.log(event);
//     // Adding in the middle is too hard
//     if (chatbox.selectionStart !== chatbox.value.length){
//         await doInit();
//     } else {
//         isInsert = type => ["insertText",  "insertCompositionText"].includes(type) || type.startsWith("insertFrom");
//         if (isInsert(event.inputType)) {changes += event.data;console.log(event.data)}
//         else if (event.inputType === "insertLineBreak") changes += "\n";
//         // FFS! The event deleteContentBackward gives you no info about how much has been deleted???? select all + backspace gives one event
//         // tracking deletion is too annoying, just ignore and reload chatbox
//         else await doInit();
//     }
//     console.log(changes);
// })

// get initial data
async function doInit() {
    response = await fetch("/chatbox.txt", {method: "GET"});
    if (!response.ok) {
        console.log(response);
        alert(response);
        return;
    }
    chatbox.value = await response.text();
}

window.addEventListener("DOMContentLoaded", () => {
    let changes = "";
    const chatbox = document.getElementById('chatbox');
    const websocket = new WebSocket("ws://localhost:6789/");

    chatbox.addEventListener('input', async event => {
        let changes = "";
        console.log(event);
        isInsert = type => ["insertText",  "insertCompositionText"].includes(type) || type.startsWith("insertFrom");
        // Adding in the middle is too hard
        if (chatbox.selectionStart !== chatbox.value.length) {
            await doInit();
        } else if (isInsert(event.inputType)) {
            changes += event.data;console.log(event.data);
        } else if (event.inputType === "insertLineBreak") {
            changes += "\n";
        // FFS! The event deleteContentBackward gives you no info about how much has been deleted???? select all + backspace gives one event
        // tracking deletion is too annoying, just ignore and reload chatbox
        } else {
            await doInit();
        }
        
        console.log(changes);
        if (changes) {
            websocket.send(changes);
        }
    })
  
    websocket.onmessage = ({ data }) => {
      chatbox.value = data;
    };
  
});

window.addEventListener("DOMContentLoaded", () => {
    let server_chatlog = "";
    let client_chatcounter = 0;
    let server_chatcounter = 0;
    let client_local_changes = "";
    const chatbox = document.getElementById('chatbox');
    chatbox.value=""; // for some reason it keeps this over page reloads
    let host = "localhost"; 
    if (window.location.host !== "") {
        host = window.location.host;
    };
    const websocket = new WebSocket(`ws://${host}:8001/`);

    chatbox.addEventListener('input', async event => {
        let changes = "";
        function undoChanges() {
            chatbox.setSelectionRange(chatbox.value.length,chatbox.value.length);
            chatbox.value = server_chatlog;
            chatbox.scrollTop = chatbox.scrollHeight;
        };
        isInsert = type => ["insertText",  "insertCompositionText"].includes(type) || type.startsWith("insertFrom");
        // Adding in the middle is too hard
        if (chatbox.selectionStart !== chatbox.value.length) {
            undoChanges();
        } else 
        if (isInsert(event.inputType) && event.data !== null) {  // chrome sometimes has event.data=null here ???
            changes += event.data;
        } else if (event.inputType === "insertLineBreak") {
            changes += "\n";
        // FFS! The event deleteContentBackward gives you no info about how much has been deleted???? select all + backspace gives one event
        // tracking deletion is too annoying, just ignore and reload chatbox
        } else {
            undoChanges();
        }
        
        if (changes !== "") {
            client_local_changes += changes;
            client_chatcounter += changes.length;
            websocket.send(changes);
        }
    });
  
    websocket.onmessage = ({ data }) => {
        const message = JSON.parse(data);
        console.log("onmessage");
        console.log(message);
        if ("chatcounter" in message) {
            server_chatcounter = message["chatcounter"];
        }
        if ("chatmessage" in message){
            server_chatlog += message.chatmessage;
            // .slice(-n) keeps the last n characters, so n should be length of the local changes
            client_local_changes = client_local_changes.slice(client_local_changes.length+server_chatcounter-client_chatcounter);
            chatbox.value = server_chatlog + client_local_changes;
            chatbox.scrollTop = chatbox.scrollHeight;
        }
    };

    websocket.onclose = (event) => {
        console.log("onclose");
        console.log(event);
        chatbox.value += "\n:(\nerror\ndetails in console";
        chatbox.setSelectionRange(chatbox.value.length, chatbox.value.length);
        chatbox.disabled = true;
    };

    websocket.onerror = (event) => {
        console.log("onerror");
        console.log(event);
        chatbox.value += "\n:(\nerror\ndetails in console";
        chatbox.setSelectionRange(chatbox.value.length, chatbox.value.length);
        chatbox.disabled = true;
    };
    
    chatbox.onfocus = (event) => {
        chatbox.setSelectionRange(chatbox.value.length, chatbox.value.length);
    };

    // using height relative to viewport seems broken in css, but we can set it in js 
    document.body.style.height = window.innerHeight*1 + "px";
    window.onresize = (event) => {
        document.body.style.height = window.innerHeight*1 + "px";
    };
});

// Chrome: The focus event fires before the cursor is placed,
// so set selection range doesnt work
// Chrome: You don't get the paste data when a paste happens,
// so I dont implement paste for chrome

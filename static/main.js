window.addEventListener("DOMContentLoaded", () => {
    let server_chatlog = "";
    let client_chatcounter = 0;
    let server_chatcounter = 0;
    const chatbox = document.getElementById('chatbox');
    let host = "localhost"; 
    if (window.location.host !== "") {
        host = window.location.host;
    }
    const websocket = new WebSocket(`ws://${host}:8001/`);

    chatbox.addEventListener('input', async event => {
        let changes = "";
        function undoChanges() {
            chatbox.selectionStart = chatbox.value.length;
            chatbox.value = server_chatlog;
        };
        isInsert = type => ["insertText",  "insertCompositionText"].includes(type) || type.startsWith("insertFrom");
        // Adding in the middle is too hard
        if (chatbox.selectionStart !== chatbox.value.length) {
            undoChanges();
        } else if (isInsert(event.inputType) && event.data !== null) {  // chrome sometimes has event.data=null here ???
            changes += event.data;
        } else if (event.inputType === "insertLineBreak") {
            changes += "\n";
        // FFS! The event deleteContentBackward gives you no info about how much has been deleted???? select all + backspace gives one event
        // tracking deletion is too annoying, just ignore and reload chatbox
        } else {
            undoChanges();
        }
        
        if (changes) {
            client_chatcounter += changes.length
            websocket.send(changes);
        }
    })
  
    websocket.onmessage = ({ data }) => {
        if ("chatcounter" in data) {
            server_chatcounter = data["chatcounter"]
        }
        if ("chatlog" in data){
            server_chatlog = data;
            if (client_chatcounter === server_chatcounter){
                chatbox.value = server_chatlog;
                chatbox.selectionStart = chatbox.value.length;
            }
        }
    };

    websocket.onclose = (event) => {
        console.log("onclose");
        console.log(event);
        chatbox.disabled = true;
        chatbox.value += "\n:(\nerror\ndetails in console";
    }

    socket.onerror = (event) => {
        console.log("onclose");
        console.log(event);
        chatbox.disabled = true;
        chatbox.value += "\n:(\nerror\ndetails in console";
      };
});

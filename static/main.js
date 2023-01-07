window.addEventListener("DOMContentLoaded", () => {
    let chatlog = "";
    const chatbox = document.getElementById('chatbox');
    const websocket = new WebSocket("ws://localhost:6789/");

    chatbox.addEventListener('input', async event => {
        let changes = "";
        function undoChanges() {
            chatbox.selectionStart = chatbox.value.length;
            chatbox.value = chatlog;
        };
        isInsert = type => ["insertText",  "insertCompositionText"].includes(type) || type.startsWith("insertFrom");
        // Adding in the middle is too hard
        if (chatbox.selectionStart !== chatbox.value.length) {
            undoChanges();
        } else if (isInsert(event.inputType)) {
            changes += event.data;
        } else if (event.inputType === "insertLineBreak") {
            changes += "\n";
        // FFS! The event deleteContentBackward gives you no info about how much has been deleted???? select all + backspace gives one event
        // tracking deletion is too annoying, just ignore and reload chatbox
        } else {
            undoChanges();
        }
        
        if (changes) {
            websocket.send(changes);
        }
    })
  
    websocket.onmessage = ({ data }) => {
        chatlog = data;
        chatbox.value = chatlog;
    };
  
});

// =========================================
// MESSAGES — REAL-TIME CHAT
// =========================================

// Get logged-in user
async function getCurrentUser() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        document.getElementById("messageLoading").textContent =
            "Please log in to view messages.";
        return null;
    }

    return user;
}


// =========================================
// LOAD MESSAGES
// =========================================

async function loadMessages() {

    const user = await getCurrentUser();

    if (!user) return;


    const messageList =
        document.getElementById("messageList");

    const loading =
        document.getElementById("messageLoading");


    const { data: messages, error } =
        await supabaseClient
            .from("messages")
            .select(`
                id,
                sender_id,
                receiver_id,
                message,
                created_at
            `)
            .or(
                `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Messages loading error:",
            error
        );

        loading.textContent =
            "Unable to load messages.";

        return;
    }


    // Remove loading message
    messageList.innerHTML = "";


    // No messages
    if (!messages || messages.length === 0) {

        messageList.innerHTML = `
            <p style="
                text-align: center;
                color: #64748b;
                padding: 40px;
            ">
                No messages yet.
            </p>
        `;

        return;
    }


    // Display messages
    messages.forEach(function (msg) {

        const isMine =
            msg.sender_id === user.id;


        const messageBubble =
            document.createElement("div");


        messageBubble.style.cssText = `
            display: flex;
            justify-content: ${isMine ? "flex-end" : "flex-start"};
            margin-bottom: 12px;
        `;


        messageBubble.innerHTML = `
            <div style="
                max-width: 70%;
                padding: 10px 14px;
                border-radius: 12px;
                background: ${isMine ? "#2563eb" : "#e2e8f0"};
                color: ${isMine ? "white" : "#0f172a"};
            ">
                ${msg.message}
                <div style="
                    font-size: 11px;
                    opacity: 0.7;
                    margin-top: 5px;
                ">
                    ${new Date(msg.created_at).toLocaleString()}
                </div>
            </div>
        `;


        messageList.appendChild(
            messageBubble
        );

    });


    // Scroll to latest message
    messageList.scrollTop =
        messageList.scrollHeight;
}


// =========================================
// REAL-TIME LISTENER
// =========================================

function startRealtime() {

    supabaseClient
        .channel("messages-realtime")

        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages"
            },
            function () {

                loadMessages();

            }
        )

        .subscribe();

}


// =========================================
// START
// =========================================

loadMessages();

startRealtime();

// =========================================
// SEND MESSAGE
// =========================================

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const messageError =
    document.getElementById("messageError");


messageForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const user = await getCurrentUser();

        if (!user) return;


        const text =
            messageInput.value.trim();


        if (!text) {

            messageError.textContent =
                "Please enter a message.";

            return;
        }


        // Find the other person from existing conversation
        const {
            data: existingMessage,
            error: findError
        } =
            await supabaseClient
                .from("messages")
               .select("sender_id, receiver_id, application_id")
                .or(
                    `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
                )
                .limit(1)
                .single();


        if (findError || !existingMessage) {

            messageError.textContent =
                "No conversation found.";

            return;
        }


        const receiverId =
            existingMessage.sender_id === user.id
                ? existingMessage.receiver_id
                : existingMessage.sender_id;
                const applicationId =
    existingMessage.application_id;


        // Send message
        const {
            error: sendError
        } =
            await supabaseClient
                .from("messages")
                .insert({

    sender_id: user.id,

    receiver_id: receiverId,

    application_id: applicationId,

    message: text

});


        if (sendError) {

            console.error(
                "Send message error:",
                sendError
            );

            messageError.textContent =
                sendError.message;

            return;
        }


        messageInput.value = "";

        messageError.textContent = "";

    }
);
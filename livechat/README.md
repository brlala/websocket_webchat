# websocket_demo
This is an introduction to websockets from client and server.

# Livechat
This product is the implementation of a Websocket backend Livechat connected to a third party client, in our case is our company's Widget, Facebook Messenger, WeChat, Telegram etc. 

Summary:
1. A user shall request for a LiveChat Agent to attend to his question.
2. On the Agent's browser, a request for livechat should showup where the users will be able to either "Accept" or "Decline".
3. If the Agent Accepts, a websocket will be established and a customized message can be published to the Gateway (e.g. xxx has entered the chat) which will then be forwarded to the user.
4. The status of the room will be changed to engaged, and no other users can enter this room after. The livechat will remain connected until the agent terminates the session.
5. x amount of messages(configurable from Database), can be loaded upon entering the page.
6. Each agent will have their own version of Canned Response to increase their efficiency in replying commonly asked question.
7. When an Agent disconnects, the websocket will be terminated and a customized messaged will be sent to the Agent as well.

Production Code is inside the folder livechat with the following techstack
1. MongoDB(Mongoose), Websocket(Socket.io), RabbitMQ(amqplib), Docker, express, express-validator middleware

Features:
1. Scalable through the use of publisher/subscriber pattern through the use of RabbitMQ
2. Reconnection when connection drops for RabbitMQ and MongoDB Database
3. Use of authentication middleware for REST and websocket connections
3. Use of error handling middleware for REST endpoints
4. PBKDF2-SHA512 + randomized salt for encryption
5. Authenticate require fields using authentication middleware
5. Clean and modular code, DRY Principle and SOLID principle (adapted from the code Clean Code)
6. Object-Oriented programming
7. Role based authentication middleware
8. Sending of image and files
9. uploading of files to amazon/alibaba bucket
10. Added default seed to database to create superuser and first setup

Project Requirements:
1. Permission Group for different users
2. Load Messages upon entering
3. Canned Response for Agents to customize
7. Role based authentication middleware

# REST API Endpoints
### Canned Response
```
URL: canned-response/
Sample body request:
// Create (POST) AUTH+PERMISSION NEEDED
{
    "name": "hi",
    "text": "你好！",
    "language": "CN"
}

// Read (GET) AUTH+PERMISSION NEEDED
{}

// Update (PUT), send the new document back, it will replace the old document, AUTH+PERMISSION NEEDED
{
    "responseId": "5f5753c4bba1270b7ce5b575",
    "updatedResponse": {
        "_id": "5f5753c4bba1270b7ce5b575",
        "user": "5f507706ff6b9c68989009e5",
        "name": "hi1",
        "text": {
            "CN": "你好！"
        },
        "is_active": true,
        "created_at": "2020-09-08T09:56:21.045Z"
    }
}

// Delete (DELETE) AUTH+PERMISSION NEEDED
{
    "responseId": "5f5753c4bba1270b7ce5b575"
}

// Sample document
{ 
    "_id" : ObjectId("5f5753c4bba1270b7ce5b575"), 
    "user" : ObjectId("5f507706ff6b9c68989009e5"), 
    "name" : "hi", 
    "text" : {
        "CN" : "你好！", 
        "MY" : "Apa Khabar?", 
        "EN" : "Hi!!!"
    }, 
    "is_active" : true, 
    "selected" : false, 
    "created_at" : ISODate("2020-09-08T17:37:47.687+0800"), 
    "updated_at" : ISODate("2020-09-08T17:56:08.927+0800")
}
```

### User Tags
```
URL: /users/tag

// Read (GET) AUTH+PERMISSION NEEDED
{
    "id": "5f102a919e9dab93d2bb5bc2"
}

// Edit (PUT) AUTH+PERMISSION NEEDED
{
    "id": "5f102a919e9dab93d2bb5bc3", <-- botUser ID/session ID
    "tags": ["test1", "test2"]
}

```

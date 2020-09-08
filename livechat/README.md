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

Project Requirements:
1. Permission Group for different users
2. Load Messages upon entering
3. Canned Response for Agents to customize

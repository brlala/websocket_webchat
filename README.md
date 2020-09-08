# websocket_demo
This is an introduction to websockets from client and server.

Production Code is inside the folder livechat with the following techstack
1. MongoDB(Mongoose), Socket.io, RabbitMQ, Docker

Features:
1. Scalable through the use of publisher/subscriber pattern through the use of RabbitMQ
2. Reconnection when connection is dropped for RabbitMQ and MongoDB Database
3. Use of authentication middleware for REST and websocket connections
3. Use of error handling middleware for REST endpoints
4. PBKDF2-SHA512 + randomized salt for encryption
5. Clean and modular code, DRY Principle and SOLID principle (adapted from the code Clean Code)
6. Object-Oriented programming

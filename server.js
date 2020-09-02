const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const cors = require('cors');
const dotEnv = require('dotenv');
const DataLoader = require('dataloader');

const resolvers = require('./resolvers');
const typeDefs = require('./typeDefs')
const { connection } = require('./database/util');
const { verifyUser } = require('./helper/context');
const loaders = require('./loaders');

//set env variables
dotEnv.config();

const app = express();

//cors
app.use(cors());

//db connectivity
connection();

//body parser middleware
app.use(express.json());


const apolloServer = new ApolloServer({
	typeDefs,
	resolvers,
	context: async ({req, connection}) => {
		const contextObj = {};
		if(req){
			await verifyUser(req);
			contextObj.email = req.email;
			contextObj.loggedInUserId = req.loggedInUserId;
		}
		contextObj.loaders = {
			user: new DataLoader(keys => loaders.user.batchUsers(keys))
		}
		return contextObj;
	},
	formatError: (error) => {
		console.log(error);
		return {
			message: error.message
		}
	}
});

apolloServer.applyMiddleware({app, path: '/graphql'});

const PORT =  3001 || process.env.PORT;

app.use('/', (req, res, next) => {
	res.send({message: 'Hello'});
})

const httpServer = app.listen(PORT, () => {
	console.log(`Server listening on PORT: ${PORT}`);
	console.log(`Graphql Endpoint: ${apolloServer.graphqlPath}`);
});

apolloServer.installSubscriptionHandlers(httpServer);
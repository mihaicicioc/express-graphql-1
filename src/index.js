/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

const express = require('express');
const graphqlHTTP = require('express-graphql');

const { schema, rootValue } = require('./schema');

const PORT = 4000;
const GRAPHQL_ROUTE = '/';

const app = express();

async function getContextObj(req) {
    const contextObj = {
        isAdmin: false,
    };

    if (req.headers && req.headers.authorization && req.headers.authorization === 'admin') {
        contextObj.isAdmin = true;
    }

    // what you return here will be the "context" param in the resolvers
    return contextObj;
}

app.use(
    GRAPHQL_ROUTE,
    // the entry point in the entire flow.
    graphqlHTTP(
        async (request, response, graphQLParams) => {
            return {
                schema,
                rootValue,
                graphiql: true,
                // here context is an object, whereas in apollo-server it is a function.
                context: await getContextObj(request),
                customFormatErrorFn: (error) => {
                    return error;
                },
            };
        },
    ),
);

app.listen(PORT);

console.log(`Server ready at http://localhost:${PORT}${GRAPHQL_ROUTE}`);

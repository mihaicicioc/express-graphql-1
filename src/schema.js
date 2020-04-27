/* eslint-disable no-unused-vars */

const { buildSchema, GraphQLError } = require('graphql');
const uuid = require('uuid');

const { users, posts } = require('./data');

const schema = buildSchema(`
    # One line comment.

    """
    Documentation for a type.
    """
    type User {
        id: ID!
        name: String!
        age: Int
        """
        Documentation for a property.
        """
        address: Address
        posts: [Post]
        followers: [User]
    }

    type Address {
        city: String
        country: String
    }

    type Post {
        id: ID!
        userId: ID!
        title: String!
        content: String
    }
    
    input CreatePostInput {
        userId: ID!
        title: String!
        content: String
    }

    type Query {
        user(id: ID!): User
        users: [User]
        post(id: ID!): Post
    }

    type Mutation {
        createPost(input: CreatePostInput!): Post
        deletePost(id: ID!): Post
    }
`);

/**
 * We need to make this trick to add other resolvers.
 */
class User {
    constructor(userDataObj) {
        this.id = userDataObj.id;
        this.name = userDataObj.name;
        this.age = userDataObj.age;
        this.address = userDataObj.address; // shallow
        this.followerIds = userDataObj.followerIds; // shallow
    }

    // a custom resolver
    async posts(args, context, info) {
        return posts.filter((p) => {
            return p.userId === this.id;
        });
    }

    // a custom resolver
    async followers(args, context, info) {
        return this.followerIds.map((fId) => {
            const user = users.find((u) => {
                return u.id === fId;
            });

            return new User(user);
        });
    }
}

const wrappedUsers = users.map((u) => {
    return new User(u);
});

const rootValue = {
    // query

    async user(args, context, info) {
        return wrappedUsers.find((u) => {
            return u.id === args.id;
        });
    },

    async users(args, context, info) {
        return wrappedUsers;
    },

    async post(args, context, info) {
        return wrappedUsers.find((post) => {
            return post.id === args.id;
        });
    },

    // mutation

    async createPost(args, context, info) {
        // check if user exists.
        const user = wrappedUsers.find((u) => {
            return u.id === args.input.userId;
        });
        if (!user) {
            throw new GraphQLError('The user does not exist.');
        }

        const post = {
            id: uuid.v4(),
            userId: args.input.userId,
            title: args.input.title,
            content: args.input.content,
        };

        posts.push(post);

        return post;
    },

    async deletePost(args, context, info) {
        if (!context.isAdmin) {
            throw new GraphQLError('Not allowed to perform this action.');
        }

        const idx = posts.findIndex((p) => {
            return p.id === args.id;
        });

        if (idx === -1) {
            return null;
        }

        return posts.splice(idx, 1)[0];
    },

    // notice that we don't define types here, like we did in apollo-server.
    // to define the resolvers for the type User, we use a class (i.e. the User class)
};

module.exports = {
    schema,
    rootValue,
};

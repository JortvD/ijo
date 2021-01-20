const {CryptoUtils} = require("ijo-utils");
const Model = require("../database/model");
const RoleHandler = require("./role/handler");

/**
 * This is the model for a user.
 * @memberof user
 */
class UserModel extends Model {
    /**
     * Constructs this user from the given data object.
     * @param {Object} data The given user data.
     * @param {Object} id The id of the user.
     * @param {String} data.username The username of the user.
     * @param {String} data.password The hashed password of the user.
     */
    constructor({id, username, password, roleHandler}={}, {roles}={}) {
        super();

        if(roles === undefined) roles = [];

        this.id = id;
        this.username = username;
        this.password = password;
        this.roleHandler = new RoleHandler(roles);
    }

    /**
     * Changes this user's password to the given plain text password. The password is first hashed before being used.
     * @param {String} plain The plaintext password.
     */
    setPassword(plain) {
        this.password = CryptoUtils.hash(plain);
    }

    /**
     * Checks if the given plaintext password is equal to the password of this user. This is checked by first hashing
     * the given plaintext password before comparing.
     * @param {String} plain The plaintext password.
     * @returns {Boolean} If the given plaintext password is equal to this user's password.
     */
    isEqualPassword(plain) {
        const hashedPassword = CryptoUtils.hash(plain);

        return this.password === hashedPassword;
    }

    /**
     * Reconstructs this user as an object and returns that object.
     */
    toObject() {
        super.toObject();
        
        return {
            id: this.id,
            username: this.username,
            password: this.password,
            permissions: this.roleHandler.toObject()
        };
    }
}

module.exports = UserModel;
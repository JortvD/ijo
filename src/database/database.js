const Collection = require("./collection");

/**
 * This is the abstract Database class, which can be extendend by implementations. These implementations should then
 * provide the api outlined in this class. This ensure that code using this api in IJO and its plugins can rely on its
 * uniformity.
 * @memberof database
 * @abstract
 */
class Database {
	constructor() {
		/**
		 * An array of registered collections.
		 * @type {Array.<Collection>}
		 */
		this.collections = [];
	}

	/**
	 * Registers a collection for this database. This unusual api for MongoDB makes the implementation of JSON and 
	 * MySQL databasing easier by enabling default values to be set. It also help to create a cache for the JSON
	 * implementation for example. You register the collection by specifing its name and which model class should be
	 * created whenever an item is retreived from the collection. This eases handling with models and enables them to
	 * contain their own logic.
	 * @param {String} name The name of the collection to register.
	 * @param {Class} modelClass The class of the model for the collection.
	 */
	register(name, modelClass) {}

	/**
	 * Unregisters an collection, found using the supplied name, for this database.
	 * @param {String} name The name of the collection to unregister.
	 */
	unregister(name) {}

	/**
	 * Returns the collection specified by its name.
	 * @param {String} name The name of the collection to return.
	 * @returns {Collection} The specified collection.
	 */
	collection(name) {}

	/**
	 * Loads and sets up the database. Depending on the implementation this function may connect to the database or 
	 * ensure the loading of collections, as is the case for the JSON implementation. This function is expected to be 
	 * async.
	 * @returns {Promise} A promise that is resolved when the database has been loaded.
	 */
	load() {}

	/**
	 * Closes and/or saves the database, depending on the implementation. This function is expected to be async.
	 * @returns {Promise} A promise that is resolved when the database connection has been closed.
	 */
	close() {}
}

module.exports = Database;
const nodePath = require("path")

/**
 * This is the model class for a plugin.
 * @memberof plugin
 */
class Plugin {
    /**
     * Creates the plugin with the specified data.
     * @param {Object} data The data for the plugin.
     * @param {String} data.name {@link plugin.Plugin#name}
     * @param {Array<String>} data.dependencies {@link plugin.Plugin#dependencies}
     * @param {String} data.index {@link plugin.Plugin#index}
     * @param {String} data.author {@link plugin.Plugin#author}
     * @param {String} path The path to the plugin. 
     */
	constructor({name, dependencies, index, author} = {}, path) {
        /** The name of the plugin. 
         * @type {String} */
        this.name = name;
        /** The arrry of plugin names this plugin depends on. 
         * @type {Array.<String>} */
        this.dependencies = dependencies;
        /** The path to the index file, relative to the path of the plugin.
         * @type {String} */
        this.index = index;
        /** The author of the plugin. 
         * @type {String} */
        this.author = author;
        /** The path to the plugin.
         * @type {String} */
        this.path = path;
        /** If the plugin has been loaded.
         * @type {boolean} */
        this.loaded = false;
        /** If the plugin has been enabled. 
         * @type {boolean} */
        this.enabled = false;
    }

    /**
     * Loads this plugin using its index file. It will throw an error when the loading was unsuccessful. If the plugin
     * has already been loaded, it won't load again.
	 * @param {Core} core IJO's core. Use with care!
     * @returns {Promise} A promise that resolves when the plugin is loaded.
     */
    async load(core) {
        if(this.loaded) return;

        try {
            const indexPath = nodePath.join(this.path, this.index);

            this.loadedIndex = require(indexPath);
            await this.execute("load", [core]).catch(e => {throw e});
            this.loaded = true;
        }
        catch(err) {
            throw Error(`There was an error while loading ${this.name}: ${err.message}`);
        }
    }

    /**
     * Enabled the plugin as long as it is loaded and disabled.
     * @returns {Promise} A promise that resolves when the plugin is enabled.
     */
    async enable() {
        if(this.enabled || !this.loaded) return;

        await this.execute("enable").catch(e => {throw e});
        this.enabled = true;
    }

    /**
     * Disables the plugin as long as it is loaded and enabled.
     * @returns {Promise} A promise that resolves when the plugin is disabled.
     */
    async disable() {
        if(!this.enabled || !this.loaded) return;

        await this.execute("disable").catch(e => {throw e});
        this.enabled = false;
    }

    /**
     * Unloads the plugin as long as it is loaded and disabled.
     * @returns {Promise} A promise that resolves when the plugin is unloaded.
     */
    async unload() {
        if(this.enabled || !this.loaded) return;

        await this.execute("unload").catch(e => {throw e});
        this.loaded = false;
    }

    /**
     * Checks if the loaded index can execute the specified event.
     * @param {String} event The name of the event to check.
     * @returns {Boolean} If the event can be executed.
     */
    canExecute(event) {
        return typeof this.loadedIndex[event] === "function" || typeof this.loadedIndex.__proto__[event] === "function";
    }

    /**
     * Executes the specified event on the loaded index file for this plugin. Arguments can be given to the event
     * handler on the plugin using the args parameter. An error is throw when something goes wrong during execution.
     * @param {String} event The name of the event to execute.
     * @param {Array<any>} args The arguments to give to the plugins event handler.
     * @returns {Promise<any>} A promise that resolves with what the plugin returned, when the event has been executed.
     */
    execute(event, args = []) {
        if(!this.canExecute(event)) return Promise.resolve();

        try {
            const promise = this.loadedIndex[event](...args);

            if(!(promise instanceof Promise)) return Promise.resolve(promise);

            return promise.catch(e => {throw e});
        }
        catch(err) {
            throw Error(`There was an error while executing the event ${event} for ${this.name}: ${err.message}`);
        }
    }

    /**
     * Adds all the dependencies recursively to this plugin using .getTrueDependencies.
     * @param {Array<Plugin>} plugins The array of possible dependencies.
     */
    addTrueDependencies(plugins) {
        this.trueDependencies = this.getTrueDependencies(plugins);
    }

    /**
	 * Recursively get the dependencies of the supplied list of dependencies. These "true" dependencies are then 
	 * returned as a flattened array.
     * @param {Array<Plugin>} plugins The array of possible dependencies.
     * @returns {Array<String>} The list of this plugin's true dependencies.
	 */
    getTrueDependencies(plugins) {
        const trueDependencies = [];

		for(const dependency of this.dependencies) {
			trueDependencies.push(dependency);
			trueDependencies.push(...this.getTrueDependencies(plugins, plugins.find(plugin => plugin.name === dependency).dependencies));
		}

		return trueDependencies;
    }
}

module.exports = Plugin;
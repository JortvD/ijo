const nodePath = require("path");
const {ConfigFile, FSUtils} = require("ijo-utils");
const Plugin = require("./model");

/**
 * This the class managing all plugins added to this instance of IJO.
 * @memberof plugin
 */
class Plugins {
	constructor() {
		/**
		 * The array of plugins.
		 * @type {Array.<Plugin>}
		 */
		this.plugins = [];
	}

	/**
	 * Finds the plugins inside the given path. It also parses them and checks if these plugins are correct. It will
	 * thus only return plugins that can be loaded.
	 * @param {String} path The path where search plugins.
	 * @returns {Array<Plugin>} The found plugins.
	 */
	async findPlugins(path) {
		if(!FSUtils.exists(path) || !(await FSUtils.isFolder(path).catch(e => {throw e}))) {
			await FSUtils.createFolder(path).catch(e => {throw e});
		}

		const folders = await FSUtils.readdir(path).catch(e => {throw e});
		const plugins = [];

		for(const folder of folders) {
			const pluginPath = nodePath.join(path, folder);
			const configPath = nodePath.join(pluginPath, "plugin.json");

			if(!FSUtils.exists(configPath) || !(await FSUtils.isFile(configPath).catch(e => {throw e}))) {
				throw Error(`There is no plugin configuration file for ${configPath}.`);
			}

			const config = new ConfigFile(configPath);
			await config.load().catch(e => {throw e});

			const plugin = new Plugin({
				name: config.get("name"),
				dependencies: config.get("dependencies") || [],
				author: config.get("author"),
				index: config.get("index")
			}, pluginPath);

			if(plugin.name === undefined) throw Error(`The plugin configuration at ${configPath} has no name.`);
			if(plugin.author === undefined) throw Error(`The plugin configuration at ${configPath} has no author.`);
			if(plugin.index === undefined) throw Error(`The plugin configuration at ${configPath} has no index.`);

			const indexPath = nodePath.join(plugin.path, plugin.index);

			if(!FSUtils.exists(indexPath)) throw Error(`The index file for the plugin configuration at ${configPath} doesn't exist.`);

			plugins.push(plugin);
		}

		return plugins;
	}

	/**
	 * Finds and loads all plugins in the specified folder, meanwhile checking if the plugin configuration is correct 
	 * and won't cause any trouble. Also some arguments, like the root location, that are not from the user's 
	 * configuration should be included.
	 * @param {Object} userOptions The user defined options.
	 * @param {String} userOptions.path The path to search for plugins at.
	 * @param {Object} options The options for initialization.
	 * @param {String} options.root The root for IJO.
	 * @param {Core} core IJO's core. Use with care!
	 * @returns {Promise} A promise that is resolved when the plugins have been initialized.
	 */
	async initialize({path} = {}, {root} = {}, core) {
		this.path = nodePath.join(root, path);

		// Check if folder exists and create it if it doesn't.
		const plugins = await this.findPlugins(this.path).catch(e => {throw e});
		
		// Add the true dependencies, meaning all recursively found children dependencies are included.
		plugins.forEach(plugin => plugin.addTrueDependencies(plugins));

		// Sorts all the plugins depending on which plugins depends on eachother. This enables them to be loaded in the correct order.
		this.plugins.push(...plugins.sort((a, b) => this.compareDependencies(a, b)));

		await this.load(core).catch(e => {throw e});
	}

	/**
	 * Loads all the plugins that have not yet been loaded.
	 * @param {Core} core IJO's core. Use with care!
	 * @returns {Promise} A promise that resolves when all plugins have been loaded.
	 */
	load(core) {
		return this.execute("load", [core]);
	}

	/**
	 * Unloads all the plugins that are loaded.
	 * @returns {Promise} A promise that resolves when all plugins have been unloaded.
	 */
	unload() {
		return this.execute("unload");
	}

	/**
	 * Enables all the plugins that are loaded and disabled
	 * @returns {Promise} A promise that resolves when all plugins have been enabled.
	 */
	enable() {
		return this.execute("enable");
	}

	/**
	 * Disables all the plugins that are loaded and enabled.
	 * @returns {Promise} A promise that resolves when all plugins have been disabled.
	 */
	disable() {
		return this.execute("disable");
	}

	/**
	 * Executes the specified event for all the plugins. If the specified plugin isn't supported an error is thrown.
	 * @param {String} event The event to execute.
	 * @param {Array<any>} args The arguments for the event.
	 * @returns {Promise} A promise that is resolved when the event has been executed for all the plugins.
	 */
	async execute(event, args = []) {
		for(const plugin of this.plugins) {
			await plugin[event](...args).catch(e => {throw e});
		}
	}

	/**
	 * Compares plugin a with plugin b and returns their respective order as -1, 0 or 1. This order is determined based 
	 * on which plugin depends on which other plugins. Plugins depending on another plugin should of course be loaded 
	 * after the plugin they depend on.
	 * @param {Plugin} a The first plugin to compare.
	 * @param {Plugin} b The second plugin to compare.
	 * @returns {Number} The relative order of the two plugins.
	 */
	compareDependencies(a, b) {
		const aDependencies = a.trueDependencies || [];
		const bDependencies = b.trueDependencies || [];

		if(aDependencies.includes(b.name) && bDependencies.includes(a.name)) {
			throw Error("Two plugins cannot depend on eachother.");
		}

		if(aDependencies.includes(b.name)) return 1;
		else if(bDependencies.includes(a.name)) return -1;
		else return 0;
	}
}

module.exports = Plugins;

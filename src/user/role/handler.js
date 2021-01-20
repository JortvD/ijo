/**
 * This class manages the roles for a user. Permissions are structured as 'PLUGIN/NAMESPACE/NAME'. For example: 
 * 'ijo/users/create'.
 */
class RoleHandler {
    constructor(list) {
        this.list = list;
    }

    add(id, scope) {
        if(this.list.find(role => role.id === id)) return;
    }

    remove(id) {

    }

    getScope(id) {

    }

    setScope(id) {

    }

    may(permission, scope = "*") {
        for(const role of this.list) {
            if(role.id !== id) continue;
            if(role.scope === "*") return true;
            if(role.scope === scope) return true;
            if(role.scope instanceof Array && role.scope.includes(scope)) return true;
            
            return false;
        }

        return false;
    }

    toObject() {
        return this.list;
    }
}

module.exports = Permissions;
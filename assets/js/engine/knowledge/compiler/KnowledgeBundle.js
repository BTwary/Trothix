/**
 * @fileoverview KnowledgeBundle
 *
 * Immutable compiled knowledge bundle.
 */

export class KnowledgeBundle {

    constructor(bundle) {
        Object.assign(this, bundle);
        Object.freeze(this);
    }

    getNode(id) {
        return this.nodes[id] ?? null;
    }

    getIndex(name) {
        return this.indexes[name] ?? {};
    }

}
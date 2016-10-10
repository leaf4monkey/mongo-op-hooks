/**
 * Created on 2016/10/6.
 * @fileoverview 请填写简要的文件说明.
 * @author joc (Chen Wen)
 */
import {Mongo} from 'meteor/mongo';
import {Random} from 'meteor/random';

let save = ['insertOne', 'insertMany'];
let modify = ['updateOne', 'updateMany', 'replaceOne', 'update'];
let del = ['remove', 'deleteOne', 'deleteMany'];
let opMap = {Save: 'i', Modify: 'u', Del: 'd'};
let map = {save, modify, del};

let proto = new Mongo.Collection(Random.id()).rawCollection().constructor.prototype;
let _proto = Mongo.Collection.prototype;
let getCollectionName = function (coll) {
    return coll.collectionName || coll._name;
};

let capitalize = str => str.replace(/\b\w+\b/g, (word) => word.substring(0, 1).toUpperCase() + word.substring(1));
let addHooks = function (hooks, category, when, added) {
    hooks[category] = hooks[category] || {};
    let arr = hooks[category][when] = hooks[category][when] || [];
    if (typeof added === 'function') {
        added = [added];
    }
    added.forEach(hook => typeof hook === 'function' && arr.push(hook));
};
let addRegister = function (category, when) {
    let name = '__' + when + category + '__';
    Mongo.Collection[name] = hooks => Mongo.Collection.__addHooks__(category, when, hooks);
    _proto[name] = proto[name] = function (hooks) {
        this.__addHooks__(category, when, hooks);
    };
};

let instanceHooks = {};
let runHooks = function (when, methodName, coll, ...args) {
    let getHooks = hookMap => (hookMap[methodName] || {})[when] || [];
    let hooks = getHooks(Mongo.Collection.__hooks__).concat(getHooks(instanceHooks[getCollectionName(coll)] || {}));
    hooks.forEach(hook => hook.call(coll, ...args));
};

_proto.__addHooks__ = proto.__addHooks__ = function (method, when, hooks) {
    let collectionName = getCollectionName(this);
    instanceHooks[collectionName] = instanceHooks[collectionName] || {};
    addHooks(instanceHooks[getCollectionName(this)], method, when, hooks);
};

Mongo.Collection.__hooks__ = {};
Mongo.Collection.__addHooks__ = function (method, when, hooks) {
    addHooks(Mongo.Collection.__hooks__, method, when, hooks);
};

['before', 'after'].forEach(when => addRegister('Op', when));

['Save', 'Modify', 'Del'].forEach(category => {
    ['before', 'after'].forEach(when => addRegister(category, when));
    map[category.toLowerCase()].forEach(methodName => {
        if (proto[methodName]) {
            let cappedMethodName = capitalize(methodName);
            ['before', 'after'].forEach(when => addRegister(cappedMethodName, when));

            let func = function (method) {
                return function (...args) {
                    let len = args.length;
                    let last = len && args[len - 1];
                    let lastArgIsFunc = typeof last === 'function';

                    let info = {
                        lastArgIsFunc,
                        method: methodName,
                        op: opMap[category],
                        cl: getCollectionName(this),
                        t: new Date()
                    };

                    let onReturn = (ret, ...argus) => {
                        let after = {when: 'after', ...info};
                        runHooks('after', 'Op', this, after, ret, ...argus);
                        runHooks('after', category, this, after, ret, ...argus);
                        runHooks('after', cappedMethodName, this, after, ret, ...argus);
                    };

                    let before = {when: 'before', ...info};
                    runHooks('before', 'Op', this, before, ...args);
                    runHooks('before', category, this, before, ...args);
                    runHooks('before', cappedMethodName, this, before, ...args);

                    if (!lastArgIsFunc) {
                        let ret = method.call(this, ...args);
                        onReturn(ret, ...args);
                        return ret;
                    }

                    args.pop();
                    args.push(function (...argus) {
                        let ret = last.call(this, ...argus);
                        onReturn(argus, ...args);
                        return ret;
                    });
                    method.call(this, ...args);
                };
            };
            _proto[methodName] = func(_proto[methodName]);
            proto[methodName] = func(proto[methodName]);
        }
    });
});

['before', 'after'].forEach(when => {
    let name = '__' + when + 'Insert__';
    Mongo.Collection[name] = Mongo.Collection['__' + when + 'InsertMany__'];
    _proto[name] = proto[name] = proto['__' + when + 'InsertMany__'];
});
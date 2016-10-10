## leaf4monkey:op-hooks
#### 简介
为mongo增删改操作提供hooks
#### APIs
触发时间(`triggerTime`)：`before`, `after`
操作类别(`opCategory`)：
```
{
	"op": {
		"save": ["insertOne", "insertMany", "insert"], // `insert`方法内部调用了`insertMany`，因此两者共用一组hooks
		"modify": ["updateOne", "updateMany", "replaceOne", "update"],
		"del": ["remove", "deleteOne", "deleteMany"]
	}
}
```
预设APIs：
- 名称：
`__<triggerTime><opCategory>__`(`opCategory`需要大写首字母)
- 调用示例：
```
// 传递一个回调函数，在任意增删改操作后执行，对声明的所有`collection`生效
Mongo.Collection.__afterOp__(function(opInfo, result, ...args) {
        console.log('after global op hook:\n' +
                    'op info:', JSON.stringify(opInfo) +
                    '\nresult:', JSON.stringify(result) +
                    '\nargs:', JSON.stringify(args) + '\n');
});
// 传递多个回调函数，在任意`save`类别操作后执行，仅对`clothes`生效
let Clothes = new Mongo.Collection('clothes');
Clothes.__afterSave__([
	function(opInfo, result, ...args) {
		// code
	},
	function(opInfo, result, ...args) {
		// code
	}
]);
// 具体操作的hook
Mongo.Collection.__afterUpdate__(function(opInfo, result, ...args) {
	// code
});
Clothes.__afterUpdate__(function(opInfo, result, args) {
	// code
});
```
- 回调函数的参数列表
```
[
	{
		"opInfo": {
			"when": String, // `before`或`after`
			"lastArgIsFunc": Boolean, // 最后一个参数是否为回调函数
			"method": String, // 本次操作调用的方法名，注意：调用`insert`时，该字段值为`insertMany`
			"op": String, // 操作类别名，分别以`i`, `u`, `d`对应增,删,改
			"cl": String, // 操作的`collection`名称
			"t": Date // 操作完成时间
		}
	},
	Object|Boolean|Number, // mongo-driver api返回的操作结果
	...restArgs // 剩余的所有参数为mongo-driver实际使用的参数列表,一般会有调用者传入的参数之外的其他参数
]
```
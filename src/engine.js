// import * as tf from '@tensorflow/tfjs'
// import * as linearRegression from './lr.js'

const tf = require('@tensorflow/tfjs');
const linearRegression = require('./lr');
const shuffleArray = false;

let classes = {
	0: 'Not Visited',
	1: 'Visited',
	2: 'Completed'
};

let data = [
	[['Duration', 'Price', 'Type high', 'Type reg', 'Type low'], 'label'],
	[[0.3,         1.0,     1.0,         0.0,        0.0      ],  2],
	[[1.0,         2.0,     1.0,         0.0,        0.0      ],  2],
	[[1.5,         2.0,     1.0,         0.0,        0.0      ],  2],
	[[0.5,         1.5,     0.0,         1.0,        0.0      ],  2],
	[[0.1,         0.8,     0.0,         1.0,        0.0      ],  2],
	[[0.8,         1.9,     0.0,         1.0,        0.0      ],  2],

	[[0.8,         0.2,     1.0,         0.0,        0.0      ],  1],
	[[1.2,         0.6,     1.0,         0.0,        0.0      ],  1],
	[[1.0,         1.5,     0.0,         1.0,        0.0      ],  1],
	[[0.7,         1.0,     0.0,         1.0,        0.0      ],  1],
	[[0.4,         1.9,     0.0,         0.0,        1.0      ],  1],
	[[1.1,         1.7,     0.0,         0.0,        1.0      ],  1],

	[[1.5,         0.4,     1.0,         0.0,        0.0      ],  0],
	[[2.0,         0.7,     1.0,         0.0,        0.0      ],  0],
	[[0.9,         0.3,     0.0,         1.0,        0.0      ],  0],
	[[1.8,         0.6,     0.0,         1.0,        0.0      ],  0],
	[[0.5,         0.1,     0.0,         0.0,        1.0      ],  0],
	[[0.1,         0.5,     0.0,         0.0,        1.0      ],  0],
	
	[[1.0,         1.0,     1.0,         0.0,        0.0      ],  -1],
	[[1.5,         0.5,     1.0,         0.0,        0.0      ],  -1],
	[[0.5,         1.5,     0.0,         1.0,        0.0      ],  -1],
	[[1.5,         0.5,     0.0,         1.0,        0.0      ],  -1],
	[[0.5,         2.0,     0.0,         0.0,        1.0      ],  -1],
	[[0.2,         0.6,     0.0,         0.0,        1.0      ],  -1]
];

let trainSet = data.filter(obj => obj[1] >= 0);
let testSet = data.filter(obj => obj[1] < 0);

if (shuffleArray) {
	let trainSet = trainSet
	  .map((value) => ({ value, sort: Math.random() }))
	  .sort((a, b) => a.sort - b.sort)
	  .map(({ value }) => value);
}

let xTrain = trainSet.map(obj => obj[0]);
let yTrain = trainSet.map(obj => obj[1]);

let xTest = testSet.map(obj => obj[0]);

let F = (thetas, xs) => {
    return thetas.reduce((acum, theta, i)=>{
      return acum + theta * xs[i]
    }, 0)
}

let J = (thetas) => {
	return xTrain.reduce((acum, xs, i) => {
	  return acum + Math.pow(F(thetas, xs) - yTrain[i], 4)
	}, 0)
}

let n = Object.keys(classes).length

console.time('Optimizing...')
let thetas = linearRegression(J, n)
console.timeEnd('Optimizing...')
let error = Math.sqrt(Math.sqrt(J(thetas)))
console.log(`Error: ${error}`)

let trainPred = xTrain.map((record, i) => [
	JSON.stringify(record),
	F(thetas, record),
	yTrain[i]
])

let testPred = xTest.map((record, i) => [
	JSON.stringify(record),
	F(thetas, record)
])

const model = tf.sequential();
model.add(tf.layers.dense({units: 20, inputShape: [5]}));
model.add(tf.layers.dense({units: 10}));
model.add(tf.layers.dense({units: 1}));
model.summary();

model.compile({
	optimizer: 'adam',
	loss: tf.losses.meanSquaredError,
	metrics: ['accuracy'],
});

model.fit(tf.tensor2d(xTrain), tf.tensor1d(yTrain), {
	epochs: 100,
	callbacks: {
	  onTrainEnd: async (epoch, logs) => {
	    console.log('TRAINING END')
	    model.predict(tf.tensor2d(xTrain)).print();
	    model.predict(tf.tensor2d(xTest)).print();
	  },
	}
});

module.exports = () => {
	return {
		xTrain: xTrain,
		yTrain: yTrain,
		xTest: xTest,
		trainPred: trainPred,
		testPred: testPred
	};
}
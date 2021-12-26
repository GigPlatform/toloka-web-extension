const LIMIT = 100000
const SIGMA = 0.25
const ALPHA = 2

function powerLaw(alpha){
  let sign = Math.random() < 0.5 ? -1 : 1;
  let uniform = Math.random();
  return sign * Math.pow(1 - uniform, 1 / (1 - alpha));
}

module.exports = function (J, n, updateFn){
  let thetas = Array.apply(null, Array(n))
  thetas = thetas.map(i => Math.random() * 10 - 5)

  let count = 0;
  while(count < LIMIT){
    count++;
    let temp = thetas.map((theta, i) => {
      let newTheta = theta + SIGMA * powerLaw(ALPHA)
      if(updateFn) newTheta = updateFn(newTheta, theta, i)
      return newTheta
    })
    if(J(temp) <= J(thetas)){
      thetas = temp
    }
  }
  return thetas
}
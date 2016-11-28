/**
 * 
 */
function AdbioMath(arr){
 
    var vari = this.variance(arr);
    arr = arr.map(function(d){return +d;});
    this.min = this.min_x(arr);
    this.max = this.max_x(arr);
    this.mean = this.mean(arr)
    this.variance = vari;
    this.deviation = this.deviation(vari);
    this.quartile = this.quartile(arr);
   
    return this;
  
}

AdbioMath.prototype = {
    min_x : function(arr){
        return Math.min(...arr);
      },
    max_x : function(arr){
        return Math.max(...arr);
      },
    mean : function(arr){
       var sum = arr.reduce(function(a,b){
         return a+b;
       },0);
       return sum/arr.length;
      },
    variance : function(arr){
        var m = this.mean(arr);
        var sqrSum = 0;
        arr.forEach(function(d){
          var dist = Math.abs(m-d);
      sqrSum += Math.pow(dist,2);          
        });
        return sqrSum/arr.length;
      },
    deviation : function(arr){
        if(typeof arr == Array)
          return Math.sqrt(variance(arr));
        else
          return Math.sqrt(arr);
      },
    median_x : function(arr){
        if(arr.length <= 0) return undefined;
        var median = (arr.length % 2 == 0)?(arr[Math.floor(arr.length/2)-1]+arr[Math.ceil(arr.length/2)])/2:
          arr[Math.floor(arr.length/2)];
        return median;
      },
    quartile : function(arr){
        arr.sort(function(a,b){return a-b;});
        var q1Arr = arr.length % 2 == 0? arr.slice(0,arr.length/2):arr.slice(0,Math.floor(arr.length/2));
        var q2Arr = arr;
        var q3Arr = arr.length % 2 == 0? arr.slice(arr.length/2,arr.length):arr.slice(Math.ceil(arr.length/2),arr.length);
        var data = {
          Q1:this.median_x(q1Arr),
          median:this.median_x(q2Arr),
          Q3:this.median_x(q3Arr)
        }
        var irq = (data.Q3 - data.Q1) * 1.5;
        data['outlier_min'] = data.Q1 - irq;
        data['outlier_max'] = data.Q3 + irq;
        return data;
      }
}
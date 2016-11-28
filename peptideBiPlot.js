$(document).ready(function(){
  var keys = [];
  function getMousePos(canvas, e) {
    var rect = canvas[0][0].getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
  function rectPoints(start_pos,finish_pos){
    var x_min;
    var x_max;
    var y_min;
    var y_max;
    if (start_pos.x <= finish_pos.x) {
      x_min = start_pos.x;
      x_max = finish_pos.x;
    } else {
      x_min = finish_pos.x;
      x_max = start_pos.x;
    }
    if (start_pos.y <= finish_pos.y) {
      y_min = start_pos.y;
      y_max = finish_pos.y;
    } else {
      y_min = finish_pos.y;
      y_max = start_pos.y;
    }
  
    // set upper left corner
    upper_left = {
            x: x_min,
            y: y_min
    };
    // set lower right corner
    lower_right = {
            x: x_max,
            y: y_max
    };
    return {
      x:upper_left.x,
      y:upper_left.y,
      width:lower_right.x-upper_left.x,
      height:lower_right.y-upper_left.y,
      min_x:x_min,
      max_x:x_max,
      min_y:y_min,
      max_y:y_max
    };
  }
  var renderBoxEnum = {
      DRAW:0,
      CLEAR:1,
      stringToEnum:function(str){
        return this[str.toUpperCase()];
      }
  }
  var renderBox = function(str,rect){
    switch(renderBoxEnum.stringToEnum(str)){
    case 0:
      //fill rect box
      d3.select('rect.box-select')
      .attr('x',rect.x)
      .attr('y',rect.y)
      .attr('width',rect.width)
      .attr('height',rect.height)
      .attr('stroke','black')
      .attr('fill','none');
      break;
    case 1:
      //clear rect box
      d3.select('rect.box-select')
      .attr('x',0)
      .attr('y',0)
      .attr('width',0)
      .attr('height',0)
      .attr('stroke','none');
    break;
    }
  }
  var legendmouseDown = false;
  var box_selection ={
      mouseclicked:false,
      start_pos : {
          x: 0,
          y: 0
    },
    final_pos : {
          x: 0,
          y: 0
      },
      start:function(event,i,a){
        event = event || d3.event;
        if(event.target.id !== 'comparison') return true;
        if (!this.mouseclicked && d3.event.shiftKey) {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          d3.select('#comparison').selectAll('circle').attr('fill','none');
          this.mouseclicked = true;
          this.start_pos = getMousePos(d3.select('#comparison'), event);
         /* this.getContext("2d").clearRect(0, 0,
              this.width,
              this.height);*/
        }
        return false;
      },
      during:function(event){
        event = event || d3.event;
        if (this.mouseclicked && d3.event.shiftKey) {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          var next_pos = getMousePos(d3.select('#comparison'), event);
          var rect = rectPoints(this.start_pos,next_pos);
          renderBox('draw',rect);
          /*var canvas222_ctx = this.getContext("2d");
          // clear the canvas
          canvas222_ctx.clearRect(0, 0,
              this.width, this.height);
          // draw the rectangle
          canvas222_ctx.fillStyle = 'rgba(221,113,222,.75)';
          canvas222_ctx.fillRect(this.start_pos.x, this.start_pos.y, next_pos.x
                  - this.start_pos.x, next_pos.y - this.start_pos.y);
          */
        }
        if(legendmouseDown){
          d3.event.preventDefault();
          d3.event.stopPropagation();
          var elem = d3.select('.legend');
          var mouse = getMousePos(d3.select('#comparison'), event) 
          elem.attr('transform','translate('+(mouse.x-25) +','+(mouse.y-10) +')');
        }
        return false;
      },
      end:function(event){
        event = event || d3.event;
        if (this.mouseclicked && d3.event.shiftKey) {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          this.mouseclicked = false;
          this.final_pos = getMousePos(d3.select('#comparison'), event);
          // prevent click causing a zoom action
          if (Math.abs(this.start_pos.x - this.final_pos.x) < 5
                  && Math.abs(this.start_pos.y - this.final_pos.y) < 5) return;
         
        var rect = rectPoints(this.start_pos,this.final_pos);
         
          //highlight selected
          var selected = d3.select('#comparison').selectAll('circle').filter(function(d){
            var _thisD3 = d3.select(this);
            var cx = _thisD3.attr('cx');
            var cy = _thisD3.attr('cy');
            return rect.min_x < cx && rect.max_x > cx && rect.min_y < cy && rect.max_y >cy;
          });
          selected.attr('fill',function(d){return d.color();});
          if(selected[0].length > 1){
            var content = '<div class="ui" style="margin:10px 0 0 10px;">Selected: '+selected[0].length+'/'+d3.selectAll('circle')[0].length+'</div>';
            $.jsPanel({
              position:{left:width/2,top:height/2},
              headerTitle:'Grouping Card',
              content:content,
              onclosed:function(){
                d3.selectAll('circle').style('opacity',1);
                d3.selectAll('circle').attr('fill','none');
              }
            });
          }else if(selected[0].length == 1){
            var data = selected.data()[0];
            createPanel(selected[0][0],data);
          }
          // clear selection
          renderBox('clear');
          
        }
        return false;
      }
  }
  
  var yValueKey = 'P-IC50-Correlation',
    xValueKey = 'Q-IC50-Correlation',
    xPvalKey = 'Q-IC50-Correlation-pvalue',
    yPvalKey = 'P-IC50-Correlation-pvalue',
    height=d3.select('body').node().getBoundingClientRect().height - 60,
    width=d3.select('body').node().getBoundingClientRect().width,
    padding=100,
    pvalCutoff = 0.05,
    xScale = d3.scale.linear()
      .domain([-1, 1])
      .range([padding, width-padding]).nice(),
    yScale = d3.scale.linear()
      .domain([-1,1])
      .range([height-padding, padding]).nice(),
    pointColour = function(){
      if(this[xPvalKey]<pvalCutoff && this[yPvalKey]<pvalCutoff){
        return 'red';
      }else if(this[xPvalKey]<pvalCutoff){
        return 'green';
      }else if(this[yPvalKey]<pvalCutoff){
        return 'blue';
      }else{
        return 'black';
      }
    },
    getName = function(str){
      var reg = /.+\[(.+)\]/;
      var match = reg.exec(str);
      if(match)
        return match[1];
      else
        return str;
    },
    printHtml = function(){
      var result = 
      '<div class="item pepComp"></div>'+
      '<div class="item">'+getName(yValueKey)+': '+this[yValueKey]+'</div>'+
      '<div class="item">'+getName(xPvalKey)+': '+this[xPvalKey]+'</div>'+
      '<div class="item">'+getName(yPvalKey)+': '+this[yPvalKey]+'</div>'+
      '<div class="item">Protein: '+this['Protein']+'</div>';
      return result;
    },
    circleHandler = function(data){
      d3.event.preventDefault();
      d3.event.stopPropagation();
      //popup
      createPanel(this,data);
    };
    var createPanel = function(dom,data){
      var panelWidth = 600;
      var peptideName = (data.Peptide && data.Peptide.length>0?data.Peptide:'NONE');
      var content = '<div class="ui two column grid"><div class="column"><div class="ui list" style="padding:15px 0 0 15px;margin-bottom:0;">'+data.printHtml()+'</div>';
      content += '<div id="sameProtein_'+peptideName +'" class="ui list" style="margin:0 0 0 30px;max-height:200px;overflow-y:auto;"></div>';
      content += '<div id="variance_'+peptideName+'" classs="ui list">Variance:</div></div><svg width="275" height="400" id="UIchart_'+peptideName+'" class="column"></svg></div>';
      var sameProtein =  d3.selectAll('circle').filter(function(c){
        return data.Protein == c.Protein  && data.Peptide != c.Peptide;
      }).data();
      //calculate where to place the jspanel so that it's visible on screen and not hidden by edges
      function placement(dom){
        var x = +d3.select(dom).attr('cx');
        var y = +d3.select(dom).attr('cy');
        if(x + panelWidth>window.innerWidth){
          x = x - panelWidth-10;
        }else{
          x+=10;
        }
        if(y + 450>window.innerHeight){
          y = y - 450 - 10;
        }else{
          y+=10;
        }
        return { left:x,top:y};
      }
      
      
      
      var jsPan = $.jsPanel({
        id:peptideName,
        size:{width:panelWidth,height:'auto',max_height:'600'},
        position:placement(dom),
        headerTitle:peptideName,
        content:content,
        done:function(data, textStatus, jqXHR, panel){
          panel.content.css({"width": "auto", "height": "auto"});
          panel.resize("auto", "auto");
        },
        onclosed:function(){
          d3.select('#comparison').selectAll('circle').style('opacity',1);
          d3.select('#comparison').selectAll('circle').attr('fill','none');
        }
      });
      if(jsPan){
        jsPan.on('mouseover',function(){
          d3.select('#comparison').selectAll('circle').filter(function(c){
            return data.Protein != c.Protein;
          }).style('opacity',.05);
            d3.select(dom).attr('fill',function(d){return d.color();})
        }).on('mouseout',function(){
          d3.select('#comparison').selectAll('circle').style('opacity',1);
          d3.select(dom).attr('fill','none');
        });
      }
      //create list of peptides with same protein
      d3.select('#sameProtein_'+peptideName).selectAll('div')
      .data(sameProtein)
      .enter()
      .append('div')
      .classed('item',true)
      .style('cursor','pointer')
      .text(function(p){return p.Peptide+ ' ('+getName(xValueKey)[0]+':'+p[xValueKey]+', '+getName(yValueKey)[0]+':'+p[yValueKey]+')';})
      .on('mouseover',function(p){
        d3.select('#circle_'+p.Peptide).attr('fill',function(d){return d.color;});
      })
      .on('mouseout',function(p){
        d3.select('#circle_'+p.Peptide).attr('fill','none');
      })
      .on('click',circleHandler);
      //variability section
      console.log('variance');
      d3.select('#'+peptideName).selectAll('.pepComp').data([getName(xValueKey)]).text(function(d){return d+':'+data[xValueKey];})
      var headerKeys = keys.filter(function(d){return d != 'Peptide' && d != 'Protein' && d != xValueKey && d!= yValueKey && d.indexOf('pvalue') < 0});
      
      d3.select('#variance_'+peptideName).selectAll('div')
        .data(headerKeys)
        .enter()
        .append('div')
        .classed('item pepComp',true)
        .style({'cursor':'pointer','margin-left':'10px'})
        .text(function(p){ return p + ' '+data[p];})
        
        d3.select('#'+peptideName).selectAll('.pepComp').on('mouseover',function(d){
          d3.select('#'+peptideName).select('#variance_pepetide_'+d).attr('r',3);
        }).on('mouseout',function(d){
          d3.select('#'+peptideName).select('#variance_pepetide_'+d).attr('r',0);
        });
      
      var xscale =  d3.scale.linear()
      .domain([-1, 1]).range([30,275]);
      //create chart for variance
      var yscale = d3.scale.linear()
      .domain([+data[yValueKey]-0.05, +data[yValueKey]+0.05]).range([25,350]);
      
       function makeXAxis(s) {
          s.call(d3.svg.axis()
            .scale(xscale)
            .orient("bottom")
            .tickSize(1));
        }
        function makeYAxis(s) {
          s.call(d3.svg.axis()
            .scale(yscale)
            .orient("left")
            .tickSize(1));
        }
      
      
      
      headerKeys.push(xValueKey)
      var values = headerKeys.map(function(d){return +data[d];});
      var mathValues = new AdbioMath(values);
      d3.select('#UIchart_'+peptideName).selectAll('circle')
       .data(headerKeys.map(function(d){ return {'name':getName(d),'value':data[d]};}))
    .enter()
    .append('circle')
    .attr('id',function(d){return 'variance_pepetide_'+d.name;})
    .attr('cx',function(d){return xscale(d.value);})
    .attr('cy',yscale(data[yValueKey]))
    .attr('fill','#4682B4')
    .attr('stoke','#4682B4')
    .attr('r',0);
      
      d3.select('#UIchart_'+peptideName).append("g")
      .attr('id', 'yAxis')
      .attr('transform', 'translate(25, 0)')
      .call(makeYAxis);
      
      d3.select('#UIchart_'+peptideName).append("g")
      .attr('id', 'xAxis')
      .attr('transform', 'translate(0, 350)')
      .call(makeXAxis);
      
      if(mathValues.quartile.Q1 && mathValues.quartile.Q3){
        //draw box plot
        //main line
        d3.select('#UIchart_'+peptideName).append('path')
          .attr('d','M '+xscale(mathValues.min)+' '+yscale(data[yValueKey])+' L '+xscale(mathValues.quartile.Q1)+' '+yscale(data[yValueKey])+
              'M '+xscale(mathValues.quartile.Q3)+' '+yscale(data[yValueKey])+' L '+xscale(mathValues.max)+' '+yscale(data[yValueKey]))
          .attr('stroke','#4682B4')
          .attr('fill','none');;
        //min line
        d3.select('#UIchart_'+peptideName).append('path')
        .attr('d','M '+xscale(mathValues.min)+' '+(yscale(data[yValueKey])-10)+' L '+xscale(mathValues.min)+' '+(yscale(data[yValueKey])+10))
        .attr('stroke','#4682B4')
        .attr('fill','none');;
        //max line
        d3.select('#UIchart_'+peptideName).append('path')
        .attr('d','M '+xscale(mathValues.max)+' '+(yscale(data[yValueKey])-10)+' L '+xscale(mathValues.max)+' '+(yscale(data[yValueKey])+10))
        .attr('stroke','#4682B4')
        .attr('fill','none');
        //median line
        d3.select('#UIchart_'+peptideName).append('path')
        .attr('d','M '+xscale(mathValues.quartile.median)+' '+(yscale(data[yValueKey])-10)+' L '+xscale(mathValues.quartile.median)+' '+(yscale(data[yValueKey])+10))
        .attr('stroke','#4682B4')
        .attr('fill','none');      
        //deviation box
        d3.select('#UIchart_'+peptideName).append('rect')
          .attr('x',xscale(mathValues.quartile.Q1))
          .attr('y',(yscale(data[yValueKey])-10))
          .attr('width',xscale(mathValues.quartile.Q3)-xscale(mathValues.quartile.Q1))
          .attr('height',20)
          .attr('stroke','#4682B4')
          .attr('fill','none');
      }
      //jspanel resize because adding to content after rededered, this rerenders the panel to fit everything
      jsPan.resize("600", "auto");
    }
    var render = function(chart,chemicalComp){ 
      var peptideName = function(data){
        return (data && data.length>0?data:'NONE');
      };
      var circles = chart.selectAll('circle')
      .data(chemicalComp)
      
      circles
      .attr('cx',function(d){return isNaN(d[xValueKey]) ? d3.select(this).attr('cx') : xScale(d[xValueKey]);})
      .attr('cy',function(d){return isNaN(d[yValueKey]) ? d3.select(this).attr('cx') : yScale(d[yValueKey]);})
      .attr('fill','none')
      .attr('stroke', function(d, i) {return d.color();})
      .attr('r', function(d) {
        if((isNaN(d[xValueKey]) || isNaN(d[yValueKey])
            ||xScale(d[xValueKey])<padding||xScale(d[xValueKey])>width-padding
            ||yScale(d[yValueKey])<50||yScale(d[yValueKey])>height-padding))
            return 0;
        return 6;
        });
      
      
      
      circles
      .enter()
      .append('circle')
      .attr('id',function(d){return 'circle_'+peptideName(d.Peptide);})
      //.attr('title',function(d){return (d.Peptide && d.Peptide.length>0?d.Peptide:'NONE')+' '+d.Peptide;})
      .attr('cx',function(d){return isNaN(d[xValueKey]) ? d3.select(this).attr('cx') : xScale(d[xValueKey]);})
      .attr('cy',function(d){return isNaN(d[yValueKey]) ? d3.select(this).attr('cx') : yScale(d[yValueKey]);})
      .attr('fill','none')
      .attr('stroke', function(d, i) {return d.color();})
      .attr('stroke-width',2)
      .attr('r', function(d) {
          return isNaN(d[xValueKey]) || isNaN(d[yValueKey]) ? 0 : 6;
        })
      .style('cursor', 'pointer')
      .on('click',circleHandler)
      .on('mouseover', function(d) {
        d3.select(this).attr('fill',function(d){return d.color();});
      })
      .on('mouseout', function(d) {
        d3.select(this).attr('fill','none');
      }).append("svg:title")
      .text(function(d) {return d.Protein + ' : '+peptideName(d.Peptide); });
      
      
      circles.exit().remove();
    };
    
    
   
    // init the svg elelent
    var svg = d3.select('body')
      .append('svg')
      .attr('width',width)
      .attr('height',height)
      .attr('id','comparison');
    svg.append('g')
      .append('rect')
      .classed("box-select",true);
    
    
  d3.select('svg').append('g').classed('popup');
  d3.select('svg').on("mousedown", box_selection.start);
  d3.select('svg').on("mousemove", box_selection.during, false);
  d3.select('svg').on("mouseup", box_selection.end, false);
  d3.tsv("data/CorrelationTest.txt",function(error, chemicalComp){
  //d3.tsv("data/IC50CorrelationEnrichment_2016_10_27.txt",function(error, chemicalComp){
    if(!chemicalComp){ console.log('error loading file'); return;}
    //add properties to data and reformat
     var zoom = d3.behavior.zoom()
    .x(xScale)
    .y(yScale)
    .scaleExtent([1, 10])
    .on("zoom", zoomed);
    svg.call(zoom);
    
    var dragSelect = false;
    d3.select('body').on('keydown',function(d){
      console.log('keydown');
      if(d3.event.shiftKey){
        dragSelect = true;
        svg.call(zoom).on("mousedown.zoom", null)
        .on("mousemove.zoom", null)
        .on("mouseup.zoom", null);
      }
    });
    d3.select('body').on('keyup',function(d){
      console.log('keyup');
      if(dragSelect){
        dragSelect = false;
        svg.call(zoom);
      }
    });
    
    keys = Object.keys(chemicalComp[0]);
    yValueKey = keys.filter(function(d){return d.indexOf('yKey') >=0;});
    xValueKey = keys.filter(function(d){return d.indexOf('xKey') >=0;});
    xPvalKey = keys.filter(function(d){return d.indexOf('xPVal') >=0;});
    yPvalKey = keys.filter(function(d){return d.indexOf('yPVal') >=0;});
    chemicalComp.forEach(function(d){
    d['color'] = pointColour;
    d['printHtml']=printHtml;
    d['selected']=false;
    });
    console.log(chemicalComp);
    
    var chart = svg.append('g').classed('chart',true);
    
    render(chart,chemicalComp);
    
    function makeXAxis(s) {
      s.call(d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .tickSize(1));
    }
    function makeYAxis(s) {
      s.call(d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .tickSize(1));
    }
    
    
 // Render axes
  var mouseXAxis = false;
  var mouseXdown = false;
  var startXVal = 0;
  var mouseYAxis = false;
  var mouseYdown = false;
  var startYVal = 0;
    var xaxis =svg
      .append("g")
      .attr('transform', 'translate(0, '+(height-padding+20)+')')
      .attr('id', 'xAxis')
      .style('pointer-events','all')
      .on('mouseenter',function(){
        
        if(!mouseXAxis){
          mouseXAxis = true;
          d3.event.stopPropagation();
          d3.event.preventDefault();
          d3.select(this).append('path')
            .attr('id','line')
            .attr('d','M 0 -10 L 0 30')
            .attr('transform','translate('+d3.event.clientX+',0)')
            .attr('stroke','black')
            .attr('stroke-width',2)
            .attr('fill','none')
            .style('opacity:1;pointer-events: none;');
        }
        return false;
      })
      .on('mousemove',function(){
        if(mouseXAxis){
          d3.event.stopPropagation();
          d3.event.preventDefault();
          d3.select(this.parentNode).select('#line')
          .attr('transform','translate('+d3.event.clientX+', 0)');
          if(mouseXdown){
            var rect = rectPoints({x:startXVal,y:0},{x:d3.event.clientX,y:height-padding+10});
            renderBox('draw',rect);
          }
        }
        return false;
      })
      .on('mouseleave',function(){
        console.log(this);
        mouseXAxis = false;
        d3.select(this).select('#line').remove();
      })
      .on('click',function(){        
        /*
        d3.selectAll('circle').attr('fill','none');
        var selected = d3.selectAll('circle').filter(function(d){
            var _thisD3 = d3.select(this);
            var cx = _thisD3.attr('cx');
            var cy = _thisD3.attr('cy');
            return cx > d3.event.clientX && cx < width;
          });
          selected.attr('fill',function(d){return d.color();});
          var content = '<div class="ui" style="margin:10px 0 0 10px;">Selected: '+selected[0].length+'/'+d3.selectAll('circle')[0].length+'</div>';
          $.jsPanel({
            position:{left:width/2,top:height/2},
            headerTitle:'Grouping Card',
            content:content,
            onclosed:function(){
              d3.selectAll('circle').attr('fill','none');
            }
          });*/
      }).on('mousedown',function(){
        mouseXdown = true;
        startXVal = d3.event.clientX;
      }).on('mouseup',function(){
        mouseXdown = false;
        renderBox('clear');
        if(!mouseXdown){
          var rect = rectPoints({x:startXVal,y:0},{x:d3.event.clientX,y:height-padding+10});
          //mouse up select within rect
          //highlight selected
           var selected = d3.selectAll('circle').filter(function(d){
              var _thisD3 = d3.select(this);
              var cx = _thisD3.attr('cx');
              var cy = _thisD3.attr('cy');
              return rect.min_x < cx && rect.max_x > cx && rect.min_y < cy && rect.max_y >cy;
            });
            selected.attr('fill',function(d){return d.color();});
          if(selected[0].length > 1){
            var content = '<div class="ui" style="margin:10px 0 0 10px;">Selected: '+selected[0].length+'/'+d3.selectAll('circle')[0].length+'</div>';
            $.jsPanel({
              position:{left:width/2,top:height/2},
              headerTitle:'Grouping Card',
              content:content,
              onclosed:function(){
                d3.selectAll('circle').style('opacity',1);
                d3.selectAll('circle').attr('fill','none');
              }
            });
          }else if(selected[0].length == 1){
            var data = selected.data()[0];
            createPanel(selected[0][0],data);
          }
        }
      })
      .call(makeXAxis);
  
    //axis hit box for mouse events
    xaxis.append('rect')
      .attr('height',25)
      .attr('width',width)
      .attr('fill','transparent');
    var yaxis = svg
      .append("g")
      .attr('id', 'yAxis')
      .attr('transform', 'translate('+padding+', 0)')
      .on('mouseenter',function(){
        
        if(!mouseYAxis){
          mouseYAxis = true;
          d3.event.stopPropagation();
          d3.event.preventDefault();
          d3.select(this).append('path')
            .attr('id','line')
            .attr('d','M -10 0 L 30 0')
            .attr('transform','translate(-25,'+d3.event.clientY+')')
            .attr('stroke','black')
            .attr('stroke-width',2)
            .attr('fill','none')
            .style('opacity:1;pointer-events: none;');
        }
        return false;
      })
      .on('mousemove',function(){
        if(mouseYAxis){
          d3.event.stopPropagation();
          d3.event.preventDefault();
          d3.select(this.parentNode).select('#line')
          .attr('transform','translate(-25,'+d3.event.clientY+')');
          if(mouseYdown){
            var rect = rectPoints({x:padding,y:startYVal},{y:d3.event.clientY,x:width-padding+10});
            renderBox('draw',rect);
          }
        }
        return false;
      })
      .on('mouseleave',function(){
        console.log(this);
        mouseYAxis = false;
        d3.select(this).select('#line').remove();
      })
      .on('mousedown',function(){
        mouseYdown = true;
        startYVal = d3.event.clientY;
      }).on('mouseup',function(){
        mouseYdown = false;
        renderBox('clear');
        if(!mouseYdown){
          var rect = rectPoints({y:startYVal,x:padding},{y:d3.event.clientY,x:width-padding+10});
          //mouse up select within rect
          //highlight selected
           var selected = d3.selectAll('circle').filter(function(d){
              var _thisD3 = d3.select(this);
              var cx = _thisD3.attr('cx');
              var cy = _thisD3.attr('cy');
              return rect.min_x < cx && rect.max_x > cx && rect.min_y < cy && rect.max_y >cy;
            });
            selected.attr('fill',function(d){return d.color();});
          if(selected[0].length > 1){
            var content = '<div class="ui" style="margin:10px 0 0 10px;">Selected: '+selected[0].length+'/'+d3.selectAll('circle')[0].length+'</div>';
            $.jsPanel({
              position:{left:width/2,top:height/2},
              headerTitle:'Grouping Card',
              content:content,
              onclosed:function(){
                d3.selectAll('circle').style('opacity',1);
                d3.selectAll('circle').attr('fill','none');
              }
            });
          }else if(selected[0].length == 1){
            var data = selected.data()[0];
            createPanel(selected[0][0],data);
          }
        }
      })
      .call(makeYAxis);
    
  //axis hit box for mouse events
    yaxis.append('rect')
      .attr('height',height)
      .attr('width',25)
      .attr('transform','translate(-25,0)')
      .attr('fill','transparent');
    
    svg.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ (padding/2) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
        .text(getName(yValueKey));
    
    svg.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ (width/2) +","+(height-padding/2)+")")  // centre below axis
        .text(getName(xValueKey));
    //color legend implementation
    var legend = svg.append('g').attr({'width':'90','height':'60','transform':'translate(30,30)'}).classed('legend',true).style('cursor','pointer');
    
    legend.append('rect').attr({'transform':'translate(-10,-20)','x':'0','y':'0','width':'90','height':'60','stroke':'black','fill':'transparent'});
    
    var x_corr = legend.append('g').attr('transform','translate(0,0)');
    x_corr.append('rect').attr({width:10,height:10,fill:'green','transform':'translate(0,-10)'});
    x_corr.append('text').attr({'transform':'translate(20,0)'}).text('Sig Q');
    
    var y_corr = legend.append('g').attr('transform','translate(0,15)');
    y_corr.append('rect').attr({width:10,height:10,fill:'blue','transform':'translate(0,-10)'});
    y_corr.append('text').attr({'transform':'translate(20,0)'}).text('Sig P');
    
    var both_corr = legend.append('g').attr('transform','translate(0,30)');
    both_corr.append('rect').attr({width:10,height:10,fill:'red','transform':'translate(0,-10)'});
    both_corr.append('text').attr({'transform':'translate(20,0)'}).text('Sig Both');
    
    legend.on('mousedown',function(d){
      if(!legendmouseDown){
        legendmouseDown = true;
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }
      return false;
    })
    .on('mousemove',function(d){
      /*var event = d || d3.event;
      if(mouseDown){
        d3.event.preventDefault();
        d3.event.stopPropagation();
        var elem = d3.select(this);
        var mouse = getMousePos(d3.select('#comparison'), event) 
        elem.attr('transform','translate('+(mouse.x-25) +','+(mouse.y-10) +')');
      }
      return false;*/
    })
    .on('mouseup',function(d){
      if(legendmouseDown){
        d3.event.preventDefault();
        d3.event.stopPropagation();
        legendmouseDown = false;
         var elem = d3.select(this);
         var mouse = getMousePos(d3.select('#comparison'), event) 
         elem.attr('transform','translate('+(mouse.x-25) +','+(mouse.y-10) +')');
      }
      return false;
    });
//    var inputContainer = d3.select('body')
//    .append('div')
//    .classed('ui mini input',true)
//    .style({
//        top:'20px',
//          right:'20px',
//          position:'absolute'
//        });
//    inputContainer.append('div').classed('ui label',true).text('PValue')
//    inputContainer.append('input')
//      .attr({
//        'type':'number',
//        'step':'0.001',
//        'name':'pvalue',
//        'value':pvalCutoff
//      })
      d3.select('#pvalueInput').on('change',function(a,b,c){
        pvalCutoff =parseFloat(this.value);
        d3.select('circle')
        render(chart,chemicalComp);
      });
      d3.select('#help_icon').on('click',function(d){
        $('#help_modal').modal('show');
      });
    //zoom
    function zoomed() {
      svg.select('#xAxis').call(makeXAxis);
      svg.select('#yAxis').call(makeYAxis);
      render(chart,chemicalComp);
    }
  });
 
});
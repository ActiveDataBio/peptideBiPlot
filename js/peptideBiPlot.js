$(document).ready(function(){
  $.ajax({
    url:'data/pathwayGeneList.json'
  }).done(function(geneMap){
    $.ajax({
      url:'data/human_genesymbol.txt'
    }).done(function(geneSymbolKeggMap){
      var filtered_genesymbolkegg =geneSymbolKeggMap.split('\n').filter(function(d){return d.split('\t')[3] != 'uncharacterized';});
      geneSymbolKeggMap = filtered_genesymbolkegg.reduce(function(result,item){var a = item.split('\t'); result[a[3]]=a[1]; return result;},{});
      var keggMapGeneSymbol = filtered_genesymbolkegg.reduce(function(result,item){var a = item.split('\t'); result[a[1]]=a[3]; return result;},{});
      $.ajax({
        url:'data/pathwayList.txt'
      }).done(function(pathwayList){
        pathwayList = pathwayList.split('\n').filter(function(d){var a = d.split('\t');return geneMap[a[0].replace('path:map','hsa')]; }).reduce(function(accumulator,d){var a = d.split('\t');accumulator[a[0].replace('path:map','hsa')] = a[1];return accumulator;},{});
      $.ajax({
        url:'data/genePathwayList.json'
      }).done(function(pathwayMap){
        // pathwayMap = JSON.parse(pathwayMap);
        var keys = [];
        function getMousePos(canvas, e) {
          var rect = canvas[0][0].getBoundingClientRect();
          return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          };
        }
        d3.selection.prototype.moveToFront = function() {
          return this.each(function(){
            this.parentNode.appendChild(this);
          });
        };
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
              if(event.target.id !== 'comparison' || event.target.tagName == 'circle') return true;
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
          pointColor = function(){
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
            '<div class="item">Current Peptide: '+this['Peptide']+'</div>'+
            '<div class="item pepComp">'+getName(xValueKey).split('-')[0]+' (R, pvalue): '+parseFloat(this[xValueKey]).toFixed(3)+', '+parseFloat(this[xPvalKey]).toFixed(3)+'</div>'+
            '<div class="item">'+getName(yValueKey).split('-')[0]+' (R, pvalue): '+parseFloat(this[yValueKey]).toFixed(3)+', '+parseFloat(this[yPvalKey]).toFixed(3)+'</div>';
            // '<div class="item">'+getName(xPvalKey)+': '+parseFloat(this[xPvalKey]).toFixed(3)+'</div>'+
            // '<div class="item">'+getName(yPvalKey)+': '+parseFloat(this[yPvalKey]).toFixed(3)+'</div>'+
            // '<div class="item">Protein: '+this['Protein']+'</div>';
            return result;
          },
          circleHandler = function(data){
            d3.event.preventDefault();
            d3.event.stopPropagation();
            //popup
            createPanel(this,data);
          },
          proteinHandler = function(data){
            var panelWidth = 470;
            var _this = this;
            var pathwayName =pathwayList[data.pathwayId];
            var content ='<div class="ui basic segment"><table id="pathway_'+data.pathwayId+'_panel" class="ui small compact table"></table></div>'//<div class="ui list"><div class="item">'+data.proteins.join('</div><div class="item">')+'</div></div>';
            var jsPan = $.jsPanel({
              id:data.pathwayId,
              contentSize:{width:panelWidth,height:'auto'},
              position:{my:'right-top',at:'right-top'},
              headerTitle:'Pathway: '+pathwayName,
              content:content,
              contentOverflow: 'auto',
              done:function(data, textStatus, jqXHR, panel){
                // panel.content.css({"width": "auto", "height": "auto"});
                // panel.resize("auto", "auto");
              },
              onclosed:function(){
                // d3.select('#comparison').selectAll('circle').style('opacity',1);
                // d3.select('#comparison').selectAll('circle').attr('fill','none');
              }
            });
            if(jsPan){
              jsPan.on('mouseover',function(){
                // d3.select('#comparison').selectAll('circle').filter(function(c){
                //   return data.Protein != c.Protein;
                // }).style('opacity',.05);
                //   d3.select(dom).attr('fill',function(d){return d.color();})
              }).on('mouseout',function(){
                // d3.select('#comparison').selectAll('circle').style('opacity',1);
                // d3.select(dom).attr('fill','white');
              });


            }
            // new Pagination('#pathway_'+data.pathwayId+'_panel',data.proteins);
            Array.prototype.indexOfKey = function(key,value){
              var result = -1;
              this.forEach(function(d,i){
                if(d[key] == value){
                  result= i;
                  return;
                }
              })
              return result;
            }
            var allCircles = d3.selectAll('circle').data();
            if(jsPan){
              var datatable = $('#pathway_'+data.pathwayId+'_panel').DataTable({
                dom:'ftip',
                pageLength: 20,
                data:data.proteins.filter(function(d){return allCircles.indexOfKey('Protein',d)>=0; }).map(function(d){return [d];}),
                columns: [
                  { title: "Protein" }
                ]
              });
              $('#pathway_'+data.pathwayId+'_panel').find('tbody').on('mouseover','td',function(){

                var proteinName = datatable.cell(this).data();
                d3.selectAll('circle').attr('fill','white').style('opacity',0.2);
                // r.results.forEach(function(rd){
                  d3.selectAll('circle').filter(function(e){return e.Protein == proteinName;}).attr('fill',function(d){return d.color();}).style('opacity',1).style('opacity',1).moveToFront();
                  // });
              }).on('click','td',function(){
                var proteinName = datatable.cell(this).data();
                var result;
                var abMin = 9999;
                d3.selectAll('circle').filter(function(e){return e.Protein == proteinName;}).each(function(d,i){
                  var min = Math.min(parseFloat(d[xPvalKey]), parseFloat(d[yPvalKey]));
                  if(min<abMin){
                    abMin = min;
                    result = {item:this,data:d};
                  }

                });
                  var jspanelCount = $('.jsPanel').length;
                  result.item.panelPosition = {x:(jspanelCount)*25,y:(jspanelCount)*25};
                  createPanel(result.item,result.data);

              })
            }
            // if(jsPan)
            //   jsPan.resize("auto", "auto");
            // var pagination = {
            //   currentPage:1,
            //   dom:'',
            // };
          };
          var createPanel = function(dom,data){
            var panelWidth = 600;
            var peptideName = (data.Peptide && data.Peptide.length>0?data.Peptide:'NONE');
            var proteinName = (data.Protein && data.Protein.length >0?data.Protein:'NONE');
            var content = '<div class="ui basic segment"><div class="ui top attached header">IC-50 / Phosphopeptide Abundance Correlation</div><div class="ui attached segment">'+
            '<div class="ui list">'+data.printHtml()+'</div></div>';
            content+='<div class="ui top attached header">Other '+proteinName+' Peptides</div>';
            content += '<div class="ui attached segment"><table id="sameProtein_'+peptideName +'" class="ui small compact table"><thead><th>Peptide</th><th>'+
              getName(xValueKey).split('-')[0]+' R (pvalue)</th><th>'+getName(yValueKey).split('-')[0]+' R (pvalue)</th></tr></thead></table></div>';

            content+='<div class="ui top attached header">'+proteinName+' Pathways</div>';
            content += '<div class="ui attached segment"><div id="pathwayProtein_'+peptideName +'" class="ui selection list"></div></div>';
            content += '</div>'
            //content += '<div id="variance_'+peptideName+'" classs="ui list">Variance:</div></div><svg width="275" height="400" id="UIchart_'+peptideName+'" class="column"></svg></div>';
            var sameProtein =  d3.selectAll('circle').filter(function(c){
              return data.Protein == c.Protein  && data.Peptide != c.Peptide;
            }).data();
            //calculate where to place the jspanel so that it's visible on screen and not hidden by edges
            function placement(dom){
              if(dom.panelPosition){
                return { left:dom.panelPosition.x,top:dom.panelPosition.y};
              }
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
              contentSize:{width:panelWidth,height:'auto'},
              onresized:function(){
                if(this.height() > window.innerHeight)
                  this.resize('auto',window.innerHeight);
                if(this.position().top+this.height()> window.innerHeight)
                  this.reposition({top:(this.position().top-((this.position().top+this.height())-window.innerHeight)),left:this.position().left});
              },
              contentOverflow:'auto',
              position:placement(dom),
              headerTitle:proteinName+' - '+peptideName,
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
                d3.select(dom).attr('fill','white');
              });
            }
            //create list of peptides with same protein
            if(sameProtein.length >0){
              var tableBody = d3.select('#sameProtein_'+peptideName).selectAll('tbody').data([sameProtein]).enter().append('tbody');
              var tr = tableBody.selectAll('tr').data(function(d){return d;}).enter().append('tr').style('cursor','pointer').html(function(d){
                return '<td>'+d.Peptide+'</td><td>'+parseFloat(d[xValueKey]).toFixed(3)+' (p<'+parseFloat(d[xPvalKey]).toFixed(3)+')</td><td>'+parseFloat(d[yValueKey]).toFixed(3)
                  +' (p<'+parseFloat(d[yPvalKey]).toFixed(3)+')</td>';})
              // d3.select('#sameProtein_'+peptideName).selectAll('div')
              // .data(sameProtein)
              // .enter()
              // .append('div')
              // .classed('item',true)
              // .style('cursor','pointer')
              // .html(function(p){return p.Peptide+
              //   ' ('+getName(xValueKey).split('-')[0]+' R<sup>2</sup>, '+getName(yValueKey).split('-')[0]+' R<sup>2</sup>): '+parseFloat(p[xValueKey]).toFixed(3)+', '+parseFloat(p[yValueKey]).toFixed(3);})
              .on('mouseover',function(p){
                d3.select('#circle_'+p.Peptide).attr('fill',function(d){return d.color;});
                d3.select(this).classed('active',true);
              })
              .on('mouseout',function(p){
                d3.select('#circle_'+p.Peptide).attr('fill','none');
                d3.select(this).classed('active',false);
              })
              .on('click',circleHandler);
            }else{
              // d3.select('#sameProtein_'+peptideName).selectAll('div').data(['None Found']).enter().append('div').classed('item',true).text(function(d){return d;});
              var tableBody = d3.select('#sameProtein_'+peptideName).selectAll('tbody').data([['None Found']]).enter().append('tbody');
              var tr = tableBody.selectAll('tr').data(function(d){return d;}).enter().append('tr').style('cursor','pointer').html(function(d){return '<td colspan="3" class="center aligned">'+d+'</td>';});
            }
            //pathway information
            if(geneSymbolKeggMap.hasOwnProperty(proteinName) && pathwayMap.hasOwnProperty(parseInt(geneSymbolKeggMap[proteinName].replace('hsa:','')))){
              d3.select('#pathwayProtein_'+peptideName).on('mouseout',function(d){d3.select('#pathwayProtein_'+peptideName).selectAll('.item').classed('active',false);}).selectAll('div')
              .data(pathwayMap[parseInt(geneSymbolKeggMap[proteinName].replace('hsa:',''))]).enter().append('div')
              .classed('item',true)
              .on('mouseover',function(d){
                d3.select('#pathwayProtein_'+peptideName).selectAll('.item').classed('active',false);
                d3.select(this).classed('active',true);
              }).on('click',function(d){
                console.log(d);
                // TODO: make click event for pathway to list protein
                var json = {
                  pathwayId:d,
                  proteins:geneMap[d].map(function(e){return keggMapGeneSymbol['hsa:'+e];})
                };
                proteinHandler(json);
              }).append('div').classed('content',true).text(function(d){return pathwayList[d];});
            }else{
              d3.select('#pathwayProtein_'+peptideName).selectAll('div').data(['None Found']).enter().append('div')
              .classed('item',true).text(function(d){return d;});

            }
            //variability section
            console.log('variance');

            // d3.select('#'+peptideName).selectAll('.pepComp').data([getName(xValueKey)]).text(function(d){return d+':'+data[xValueKey];})
            var headerKeys = keys.filter(function(d){return d != 'Peptide' && d != 'Protein' && d != xValueKey && d!= yValueKey && d.indexOf('pvalue') < 0});

            if(headerKeys.length > 0){
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
          }else{
            d3.select('#variance_'+peptideName).style('display','none');
          }
            //jspanel resize because adding to content after rededered, this rerenders the panel to fit everything
            if(jsPan)
              jsPan.resize("600", "auto");
          }
          var render = function(chart,chemicalComp){
            var peptideName = function(data){
              return (data && data.length>0?data:'NONE');
            };
            var circles = chart.selectAll('circle')
            .data(chemicalComp,function(d){return d.Peptide;})

            circles
            .attr('cx',function(d){return isNaN(d[xValueKey]) ? d3.select(this).attr('cx') : xScale(d[xValueKey]);})
            .attr('cy',function(d){return isNaN(d[yValueKey]) ? d3.select(this).attr('cx') : yScale(d[yValueKey]);})
            .attr('fill',function(d){return d.selected?d.color():'white'})
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
            .attr('fill','white')
            .attr('stroke', function(d, i) {return d.color();})
            .attr('stroke-width',2)
            .attr('r', function(d) {
                return isNaN(d[xValueKey]) || isNaN(d[yValueKey]) ? 0 : 6;
              })
            .style('cursor', 'pointer')
            .on('click',circleHandler)
            .on('mouseover', function(d) {
              d3.select(this).attr('fill',function(d){return d.color();}).moveToFront();
            })
            .on('mouseout', function(d) {
              d3.select(this).attr('fill','white');
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


        //d3.tsv("data/CorrelationTest.txt",function(error, chemicalComp){
        d3.tsv("data/ProbitPhosphoPeptideCorrelation_3_12_17.txt",function(error, chemicalComp){
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
            //console.log('keydown');
            if(d3.event.shiftKey){
              dragSelect = true;
              svg.call(zoom).on("mousedown.zoom", null)
              .on("mousemove.zoom", null)
              .on("mouseup.zoom", null);
            }
          });
          d3.select('body').on('keyup',function(d){
            //console.log('keyup');
            if(dragSelect){
              dragSelect = false;
              svg.call(zoom);
            }
          });
          function filterIndexOf(d){
            return d.indexOf(this) >=0;
          }
          keys = Object.keys(chemicalComp[0]);
          yValueKey = keys.filter(filterIndexOf, 'yKey');
          xValueKey = keys.filter(filterIndexOf, 'xKey');
          xPvalKey = keys.filter(filterIndexOf, 'xPVal');
          yPvalKey = keys.filter(filterIndexOf, 'yPVal');
          chemicalComp.forEach(function(d){
          d['color'] = pointColor;
          d['printHtml']=printHtml;
          d['selected']=false;
          });
          console.log(chemicalComp);

          var chart = svg.append('g').classed('chart',true);
          var searchable = [];
          chemicalComp.forEach(function(d){
            var temp = searchable.filter(function(e){return d.Protein === e.Protein});
            if(temp.length >0){
              temp[0].results.push(d);
            }else{
              temp = {Protein:d.Protein,results:[]}
              temp.results.push(d);
              searchable.push(temp);
            }
          });
          render(chart,chemicalComp);
          $('#protein_search').append(
            '<input class="prompt" type="hidden" name="protein_search">'
            + '<div class="default text">Search Proteins...</div>'
            + '<i class="dropdown icon"></i>'
            + '<div class="menu">'
            + searchable.map(function(e) {
              return '<div class="item" data-value="'+e.Protein+'">'+e.Protein+'</div>';
            }).join('')
            +'</div>'
          ).dropdown({
            onChange: function(value, text, $selectedItem) {
              var result = [];
              var abMin = 9999;
              d3.selectAll('circle')
                .attr('fill','white')
                .style('opacity',0.2);
              d3.selectAll('circle')
                .filter(function(e) {
                  return value.split(',').indexOf(e.Protein) >= 0;
                })
                .attr('fill', function(d) {
                  return d.color();
                })
                .style('opacity',1)
                .moveToFront();
              // d3.selectAll('circle')
              //   .filter(function(e) {
              //     return value.split(',').indexOf(e.Protein) >= 0;
              //   }).each(function(d,i) {
              //     var min = Math.min(parseFloat(d[xPvalKey]), parseFloat(d[yPvalKey]));
              //     if(min<abMin){
              //       abMin = min;
              //       result.push({item:this,data:d});
              //     }
              //   });
              // var jspanelCount = $('.jsPanel').length;
              // //result.item.panelPosition = {x:(jspanelCount)*25,y:(jspanelCount)*25};
              // result.forEach(function(d) {
              //   createPanel(d.item,d.data);
              // })
            },
          });

          // .search({
          //   source:searchable,
          //   searchFields:['Protein'],
          //   searchFullText: false,
          //   fields:{
          //     title:'Protein'
          //   },
          //   onResults:function(r){
          //     // console.log('onresults '+r);
          //     // d3.selectAll('circle').attr('fill','white').style('opacity',0.2);
          //     // r.results.forEach(function(rd){
          //     //   d3.selectAll('circle').data(rd.results,function(d){return d.Peptide;}).attr('fill',function(d){return d.color();}).style('opacity',1).style('opacity',1).moveToFront();
          //     //   });
          //     //render(chart,chemicalComp);
          //   },
          //   onSelect:function(r,re){
          //     console.log('onSelect '+r);
          //     // d3.selectAll('circle').attr('fill','white').style('opacity',0.2);
          //     // d3.selectAll('circle').filter(function(d){return r.Protein == d.Protein;}).each(function(data,i){
          //     //   var jspanelCount = $('.jsPanel').length;
          //     //   this.panelPosition = {x:(jspanelCount+i)*25,y:(jspanelCount+i)*25};
          //     //   createPanel(this,data);
          //     // });
          //     var result;
          //     var abMin = 9999;
          //     d3.selectAll('circle').filter(function(e){return e.Protein == r.Protein;}).each(function(d,i){
          //       var min = Math.min(parseFloat(d[xPvalKey]), parseFloat(d[yPvalKey]));
          //       if(min<abMin){
          //         abMin = min;
          //         result = {item:this,data:d};
          //       }
          //
          //     });
          //     var jspanelCount = $('.jsPanel').length;
          //     result.item.panelPosition = {x:(jspanelCount)*25,y:(jspanelCount)*25};
          //     createPanel(result.item,result.data);
          //
          //     // .data(r.results,function(d){return d.Peptide;}).attr('fill',function(d){return d.color();}).style('opacity',1).style('opacity',1).moveToFront();
          //     //render(chart,chemicalComp);
          //   },
          //   onSearchQuery:function(q){
          //     console.log('querry: '+q)
          //
          //   }
          // })
          $('#pathway_search').search({
            source:Object.keys(pathwayList).map(function(d){return {title:pathwayList[d],id:d};}),
            searchFullText: false,
            // fields:{
            //   title:'Protein'
            // },
            onResults:function(r){
              console.log('onresults ',r);
              // d3.selectAll('circle').attr('fill','white').style('opacity',0.2);
              // r.results.forEach(function(rd){
              //   d3.selectAll('circle').data(rd.results,function(d){return d.Peptide;}).attr('fill',function(d){return d.color();}).style('opacity',1).style('opacity',1).moveToFront();
              //   });
              //render(chart,chemicalComp);
            },
            onSelect:function(r,re){
              console.log('onSelect ',geneMap[r.id]);
              // d3.selectAll('circle').attr('fill','white').style('opacity',0.2);
              // d3.selectAll('circle').filter(function(d){return geneMap[r.id].map(function(e){return keggMapGeneSymbol['hsa:'+e]}).indexOf(d.Protein)>=0;}).attr('fill',function(d){return d.color();}).style('opacity',1).style('opacity',1).moveToFront();
              //render(chart,chemicalComp);
              // proteinHandler
              var json = {
                pathwayId:r.id,
                proteins:geneMap[r.id].map(function(e){return keggMapGeneSymbol['hsa:'+e];})
              };
              proteinHandler(json);

            },
            onSearchQuery:function(q){
              console.log('querry: '+q)

            }
          })

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
          var svgTop = d3.select('#comparison')[0][0].getBoundingClientRect().top;
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
                  .attr('transform','translate(-25,'+(d3.event.clientY-svgTop)+')')
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
                .attr('transform','translate(-25,'+(d3.event.clientY-svgTop)+')');
                if(mouseYdown){
                  var rect = rectPoints({x:padding,y:startYVal},{y:d3.event.clientY-svgTop,x:width-padding+10});
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
              startYVal = d3.event.clientY-svgTop;
            }).on('mouseup',function(){
              mouseYdown = false;
              renderBox('clear');
              if(!mouseYdown){
                var rect = rectPoints({y:startYVal,x:padding},{y:d3.event.clientY-svgTop,x:width-padding+10});
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

          legend.append('rect').attr({'transform':'translate(-10,-20)','x':'0','y':'0','width':'175','height':'75','stroke':'black','fill':'transparent'});

          var significance = legend.append('g').attr('transform','translate(0,0)');
          significance.append('text').attr({'transform':'translate(0,0)'}).text('Significance Color Legend');

          var x_corr = legend.append('g').attr('transform','translate(0,15)');
          x_corr.append('rect').attr({width:10,height:10,fill:'green','transform':'translate(0,-10)'});
          x_corr.append('text').attr({'transform':'translate(20,0)'}).text(getName(xValueKey).split('-')[0]);

          var y_corr = legend.append('g').attr('transform','translate(0,30)');
          y_corr.append('rect').attr({width:10,height:10,fill:'blue','transform':'translate(0,-10)'});
          y_corr.append('text').attr({'transform':'translate(20,0)'}).text(getName(yValueKey).split('-')[0]);

          var both_corr = legend.append('g').attr('transform','translate(0,45)');
          both_corr.append('rect').attr({width:10,height:10,fill:'red','transform':'translate(0,-10)'});
          both_corr.append('text').attr({'transform':'translate(20,0)'}).text('Both');

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
      })
    });
  });
});

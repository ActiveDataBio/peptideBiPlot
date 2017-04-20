function Pagination(dom,data,perPage){
  this.dom=dom;
  this.data = data;
  this.data.sort(function(a,b){return a<b?-1:1;})
  this.currentPage=1;
  this.perPage = perPage||10;
  d3.select(this.dom).append('div').classed('ui list',true).selectAll('div')
    .data(this.slicePerPage(this.currentPage)).enter().append('div').classed('item',true)
    .text(function(d){return d;})
  this.initPagination();
}

Pagination.prototype = {
  slicePerPage:function(page){
    if(page*this.perPage<this.data.length)
    return this.data.slice((page-1)*this.perPage,page*this.perPage);
    else
      return this.data.slice((page-1)*this.perPage);

  },
  initPagination:function(){
    var _this = this;
    this.paginationDom = d3.select(this.dom).append('div').classed('ui menu',true).append('div').classed('ui right pagination menu',true);
    this.paginationDom.selectAll('.item').data(this.setPagination()).enter().append('a').classed('item',true).attr('data-page',function(d){return d;}).text(function(d){return d;}).on('click',function(d){_this.changePage.call(_this,this,d);});
  },
  setPagination:function(){
    var numPages = parseInt(this.data.length/this.perPage);
    var result = [1];//'<a class="item" data-page="1">1</a>';
    if(this.currentPage<numPages){
      if(this.currentPage > 2)
        result.push(this.currentPage-1);//'<a class="item" data-page="'+(this.currentPage-1)+'">'+(this.currentPage-1)+'</a>';
      if(this.currentPage > 1)
        result.push(this.currentPage);//'<a class="item" data-page="'+(this.currentPage)+'">'+(this.currentPage)+'</a>';
      if(this.currentPage > 0)
        result.push(this.currentPage+1);//'<a class="item" data-page="'+(this.currentPage+1)+'">'+(this.currentPage+1)+'</a>';
      //'<a class="item" data-page="'+(numPages)+'">'+(numPages)+'</a>';
    }
    if(this.currentPage < numPages-2)
      result.push(numPages-2);
    if(this.currentPage < numPages-1)
      result.push(numPages-1);//'<a class="item" data-page="'+(numPages-1)+'">'+(numPages-1)+'</a>';
    // if(this.currentPage < numPages)
    result.push(numPages);
    //result += '<div class="disable item">...</div>';

    //[1].concat(d3.range(this.currentPage-1,this.currentPage+1)
    return result;
  },
  changePage:function(item,data){
    var page = parseInt(d3.select(item).attr('data-page'));
    var _this = this;
    this.currentPage=page;
    d3.select(this.dom).select('.ui.list').selectAll('.item')
      .data(this.slicePerPage(this.currentPage))
      .text(function(d){return d;})
    var pag = this.paginationDom.selectAll('.item').data(this.setPagination())
    .attr('data-page',function(d){return d;}).text(function(d){return d;})
    pag.enter().append('a').classed('item',true).attr('data-page',function(d){return d;})
    .text(function(d){return d;}).on('click',function(d){_this.changePage.call(_this,this,d);})
    pag.exit().remove();
  },
  pageNumberElement:function(page){
    return '<a class="item" data-page="'+page+'">'+page+'</a>';
  }
}

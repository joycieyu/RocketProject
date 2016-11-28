//an object representing the controller
//contains functions that can be called
var controller = {
  //download data from the url
  fetchData: function(query) {    
    //construct URL
    var uri = query;

    return fetch(uri) //download the data
      .then(function(res) { return res.json(); })
  }
};

export default controller; //export object
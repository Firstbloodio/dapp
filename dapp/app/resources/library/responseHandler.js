var responseHandler = {
  	send: function(req, res, type, status, data, message) {
	    var obj = {
		    type: type,
		    message: message,
	  	}
	  	if(data)
		    obj['data'] = data;
	  	res.status(status).send(obj);
	}
};
module.exports = responseHandler;
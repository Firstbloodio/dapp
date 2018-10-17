var Bunyan = require("bunyan");

module.exports = {
    getLogger: function(enable, name) {
    	if(enable && name){
		    return Bunyan.createLogger({
		        name: "FirstBlood Logs",
		        serializers: Bunyan.stdSerializers,
		        streams: [{ path: './logs/firstblood_' + name + '.log' }]
		    });		
		}else{
			return null;
		}
    },
    setLogs: function(log, level, message) {
    	if(log){
	    	if(level == 'error'){
	    		log.error(message);
	    	}else{
	    		log.info(message);
	    	}    		
    	}
    }
}
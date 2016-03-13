var log = function(){
    this.init = function(){
        $('#organizationSelect').change(function(){
            loadEvents();
        });
    };
    
    var displayEvents = function(result){
        console.log(result);
    };
    
    var loadEvents = function(){
        var data = {};
        data.organizationName = $("#organizationSelect option:selected").text();
        
        ajaxCall('/loadEvents', 'Post', JSON.stringify(data), 'application/json', displayEvents);
    };
    
    var ajaxCall = function(url, type, data, cType,callbackSuccess){
        $.ajax({
            url: url,
            type: type,
            data : data,
            contentType : cType,
            success: function(result){
                console.log(url + ' success');
                if (callbackSuccess != null){
                    callbackSuccess(result);
                }
             },
             error: function(data){
                console.log(url + " err: " + data);
             }
        });
    }
}
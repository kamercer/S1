$(function(){
    
    init();
    
    function init(){
        $("#join").click(function(){
            var callback = function(result){
                location.reload();
            }
            
            ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'join' : '/join')  , 'Post', null, null, callback);
        });
        
        //$("#sDate").datetimepicker();
        //$("#eDate").datetimepicker();
        
        /*
        $("#sDate").appendDtpicker({
            futureOnly : true,
            autodateOnStart : false,
            todayButton : false,
            closeOnSelected : true
        });
        $("#eDate").appendDtpicker({
            futureOnly : true,
            autodateOnStart : false,
            todayButton : false,
            closeOnSelected : true
        });
        */
        
        $("#submitEvent").click(function(){
           submitEvent();
        });
        
        $(".RSVP").click(function(){
            submitRSVP(this); 
        });

        $(".Details").click(function(){
            viewDetails(this);
        });
        
        $(".Edit").click(function(){
           editEvent(this); 
        });


        $("#updateImage").click(function(){
            $("#imageModal").modal('show');
        });

        $("#uploadPic").click(function(){
            submitPic();
        });
        
        $('.menu .item').tab();
    }
    
    var submitEvent = function(){
        var data = new FormData();
        data.append("name", $("#name").val());
        data.append("sDate", $("#sDate").val());
        data.append("eDate", $("#eDate").val());
        data.append("image", $("#eventPhoto")[0].files[0]);
        data.append("public" ,$("#public").prop("checked"));
        
        //var data = {};
        //data.name = $("#name").val();
        //data.sDate = $("#sDate").val();
        //data.eDate = $("#eDate").val();
        //data.public = $("#public").prop("checked");
        
        ajaxCall('createEvent', 'POST', data, false, null); 
    };
    
    var submitRSVP = function(event){
        var data = {};
        data.id = event.id;
        
        ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'submitRSVP' : '/submitRSVP'), 'POST', JSON.stringify(data), 'application/json', null);
    }

    function viewDetails(event){

        $("#eventImage").attr('src', "/events/eventImage/" + event.id);

        $("#detailModal").modal('show');
    }
    
    function editEvent(event){
        window.location.href = window.location.href + 'editEvent/' + event.id;
    }

    function submitPic(){
        var data = new FormData();
        
        data.append('image', $("#organizationProfileImage")[0].files[0]);
        
        ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'changeOrganizationImage' : '/changeOrganizationImage'), 'POST', data, false, null); 
    }
    
    var ajaxCall = function(url, type, data, cType,callbackSuccess){
        $.ajax({
            url: url,
            type: type,
            data : data,
            contentType : cType,
            processData: false,
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
});
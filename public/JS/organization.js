$(function(){
    
    init();
    
    function init(){
        
        $("#join").click(function(){
            var callback = function(result){
                location.reload();
            }
            
            ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'join' : '/join')  , 'Post', null, null, callback);
        });
        

        $(document).ready(function(){
            $("#orgUpdateImg").click(function(){
                $("#imageModal").modal('show');
            });
        });

        $("#uploadPic").click(function(){
            submitPic();
        });

        $("#createEvent").click(function(){
            $("#newEventModal").modal('show');
        });

        $("table tr").click(function(event){
            $("#userImg").attr('src', '/userImage/' + event.currentTarget.id);

            ajaxCall(window.location.href + 'userInfo/' + event.currentTarget.id, 'Get', null, null, function(data){ return loadUserData(data, event.currentTarget.id)});
        });

        $("#eventMenu .item").click(function(){
            $("#eventInfoModal").modal('show');
        });      

        $("#submitEvent").click(function(){
           submitEvent();
        });

        /*
        
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
        
        $('.menu .item').tab();

        */
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

    function loadUserData(data, id){

        $("#userName").text(data.first + " " + data.last);
        $("#userEmail").text(data.email);
        $("#userHours").text(data.hours);

        if(data.status == 0){
            $("#statusMenu").html("<div class=\"item\" name=\"1\">Make Admin</div><div class=\"item\" name=\"0\">Remove Member</div>")
        }else{
            $("#statusMenu").html("<div class=\"item\" name=\"2\">Make Member</div><div class=\"item\" name=\"0\">Remove Member</div>")
        }

        $(".ui.selection.dropdown").dropdown({
            onChange: function(value, text, $selectedItem){
                $("#statusChangeConfirmation .description").html("Are you sure you want to change the status of " + $("#userName").text());

                $("#statusConfirmed").click(function(){

                    var input = {};
                    input.selectedOption = $("#statusMenu .active").attr('name');
                    input.user_id = id;

                    ajaxCall(window.location.href + "changeUserStatus", 'POST', JSON.stringify(input), 'application/json', null); 
                });

                $("#statusChangeConfirmation").modal('show');
            }
        });

        $('#memberInfoModal').modal('show');
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
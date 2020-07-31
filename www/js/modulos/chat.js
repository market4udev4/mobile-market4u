
app.controller('ChatLst', ['$rootScope', '$scope', '$http', 'ReturnData', function ($rootScope, $scope, $http, ReturnData) {
    console.log(ReturnData);
    $rootScope.border_top = 1;
    $rootScope.Titulo = ReturnData.CHAT.TITULO;
    $rootScope.REDIRECT = '';
    $rootScope.NO_WHATSAPP = false;
    $scope.ITENS = ReturnData.CHAT_ITENS;
    $scope.CONVERSATION = '';
    $scope.IMAGE_UPLOADER = '';
    $scope.RESPOSTA = {id: null, text:null, image:null};
    $scope.CLIENTE = ReturnData.Login;
    $scope.initScroll = function(){
        setTimeout(function(){
            $('#panelConversa').animate({ scrollTop: $('#panelConversa').prop("scrollHeight")}, 2000);
        },1000)

    };
    $scope.init = function () {

        setTimeout(function () {
            if($('#panelConversa').length) {
                let lastID = $scope.ITENS[$scope.ITENS.length - 1].ID;
                Factory.ajax(
                    {
                        action: 'sac/getconversarion',
                        data: {
                            SAC: ReturnData.CHAT.ID,
                            ID: lastID
                        }
                    },
                    function (data) {
                        if (data.CHAT_ITENS.length > 0) {
                            data.CHAT_ITENS.forEach(function (item) {
                                $scope.ITENS.push(item);
                            });
                            $('#panelConversa').animate({ scrollTop: $('#panelConversa').prop("scrollHeight")}, 1000);
                        }
                    }
                );
                $scope.init();
            }
        },2000);
    };
    $scope.sendMessage = function(){
        if((this.ChatLst && this.ChatLst.CONVERSATION !="") || $scope.IMAGE_UPLOADER !=""){

            let text = this.ChatLst ? this.ChatLst.CONVERSATION : null;
            let anexos = $scope.IMAGE_UPLOADER != "" ? $scope.IMAGE_UPLOADER : null;

            Factory.ajax(
                {
                    action: 'sac/saveconversarion',
                    data: {
                        DESCRICAO: text,
                        SAC: ReturnData.CHAT.ID,
                        IMAGEM:anexos,
                        RESPOSTA_MENSAGEM: $scope.RESPOSTA.id
                    }
                },
                function (data) {
                    var image = $scope.imageToBase64(anexos);
                    image.then((finalImagem)=>{
                        $('#reponser').val('');
                        $scope.ITENS.push({
                            ID: data.ID,
                            SAC: ReturnData.CHAT.ID,
                            USUARIO: null,
                            DESCRICAO: text,
                            ANEXO: finalImagem,
                            DATAHORA: data.DATAHORA,
                            MENSAGEM_IN: $scope.RESPOSTA.text,
                            RESPOSTA_ANEXO: $scope.RESPOSTA.image || null
                        });

                        $('#panelConversa').animate({ scrollTop: $('#panelConversa').prop("scrollHeight")}, 500);

                        $scope.removeImage();

                        $('.responseMessage').animate({opacity: '0'},{duration: 500})
                        setTimeout(()=>{
                            $(this).parent().remove();
                        },500)

                    });


                }
            );
            if (this.ChatLst)
                this.ChatLst.CONVERSATION = '';
        }

    };
    $scope.uploadFile = function(element){
        $scope.IMAGE_UPLOADER = element.files[0];
        var reader = new FileReader();
        reader.readAsDataURL(element.files[0]);
        reader.onload = function () {
            let resize = $scope.RESPOSTA.id ? '22vh' : '11vh';
            var blockImage = '<div class="image_content">';
            blockImage += '<img src="' + reader.result + '" />';
            blockImage += '<span class="mdi-navigation-close removeImage" data-id="' + $scope.IMAGE_UPLOADER.length + '" onclick="angular.element(this).scope().removeImage(this)" ></span>';
            blockImage += '</div>';
            $('#showImage').css('width', '100vw');
            $('#showImage').css('margin-top', '1%');
            $('#showImage').append(blockImage);
            $('#panelInput').css('height', resize);
            $('#panelConversa').css('max-height','75vh');
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
    };
    $scope.removeImage = function () {
        $scope.IMAGE_UPLOADER = '';
        let valueHeight = $scope.RESPOSTA.id ? '78vh':'85vh';
        $('#showImage').empty();
        $('#showImage').css('margin', '0');
        $('#showImage').css('width', '0');
        $('#panelInput').css('height',$scope.RESPOSTA.id ?'12vh': '0');
        $('#panelConversa').animate({maxHeight: valueHeight},{duration: 500});
    };
    $scope.imageToBase64 = async function(image){
        var reader = new FileReader();
        if(image == null) return null;
        reader.readAsDataURL(image);
        return new Promise((resolve, reject) => {
            reader.onload = function () {
                $('#fileManager').val('');
                resolve(reader.result);
            };
            reader.onerror = function (error) {
                reject(error);
            };
        });
    };
    $scope.openResposeBox = (element) =>{

        if(!$(element).hasClass('activeR')){
            $('.responsearrow').removeClass('activeR')
            $('.panel_choice').css('display','none');
            $(element).addClass('activeR');
            $(element).parent().find('.panel_choice').css({'display': 'block', 'opacity': '1'});
        }else{
            $('.responsearrow').removeClass('activeR')
            $('.panel_choice').css('display','none');
            $(element).removeClass('activeR');
            $(element).parent().find('.panel_choice').css({'display': 'none', 'opacity': '0'});
        }

    }
    $scope.startResponse = (element)=>{
        var deleteAndMount = new Promise((resolve, reject) => {
            resolve($("#panelInput").find(".responseMessage").remove())
        }).then(item => {
            return true
        });
        deleteAndMount
            .then(item =>{
                $('.responsearrow').removeClass('activeR')
                $('.panel_choice').css('display','none');
                let subtext = '';
                let resize = $scope.IMAGE_UPLOADER ? '22vh' :'12vh';
                let text = $scope.RESPOSTA.text = $(element).parent().parent().find('.content_description_baloon').html();
                let image =  $(element).parent().parent().find('.content_img_baloon').html();
                if(image) $scope.RESPOSTA.image = image.split('"')[1];

                if(!text && image != undefined) subtext = 'Imagem';
                let idBaloon = $scope.RESPOSTA.id = $(element).parent().parent().data('id');
                let html ='<div class="responseMessage">';
                html += '<i class="mdi-navigation-close removeMessageResponse" ></i>';
                html += `<span data-id="${idBaloon}">${text || subtext} ${image || ''}</span>`;
                html += '</div>';
                $('#rest').css('margin-top','0');
                $("#showImage").after(html);

                $('.responseMessage').css('bottom', '-60px');
                var animationawait = new Promise((resolve, reject) => {
                    resolve($('.responseMessage').animate({bottom: '14%'},{duration: 500}));
                }).then(item =>{
                    return true;
                });
                animationawait.then(item =>{
                    $('.responseMessage').css('z-index', '1');
                    $('#panelInput').css('height', resize);
                    $('#panelConversa').animate({maxHeight: '78vh'},{duration: 500});
                    $scope.removehtmlResponse();
                })

            });
    }
    $scope.removehtmlResponse = ()=> {
        $('.removeMessageResponse').click(function(evt){
            $scope.RESPOSTA.id = null;
            $scope.RESPOSTA.text = null;
            let valueHeight = $scope.IMAGE_UPLOADER ?'76vh': '85vh';
            evt.preventDefault();
            $('.responseMessage').animate({opacity: '0'},{duration: 500})
            setTimeout(()=>{
                $(this).parent().remove();
                $('#panelInput').css('height',  $scope.IMAGE_UPLOADER ?'10%' : '0');
                $('#panelConversa').animate({maxHeight: valueHeight},{duration: 500});
            },500)
        })
    }
}]);

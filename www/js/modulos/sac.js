app.controller('SacLst', function ($rootScope, $scope, ReturnData) {

    $rootScope.border_top = 1;
    $rootScope.Titulo = "Posso ajudar?";
    $rootScope.REDIRECT = '';
    $rootScope.NO_WHATSAPP = false;
    $scope.ABERTOS = ReturnData.ABERTOS;
    $scope.FECHADOS = ReturnData.FECHADOS;
    $scope.PONTUACAO_TEMP = '0';
    $scope.LOGIN = ReturnData.Login;
    $scope.TransitionAbas = function (element) {
        var label = element.parentElement.querySelectorAll('.borderAba');

        if(!label[0].classList.contains('active')){
            var active = document.querySelectorAll('.active')[0];

            var animateA =  [{right: '20%'}, {right: '40%'}, {right: '60%'}, {right: '80%'}, {right: '100%'}];

            if(label[0].classList.contains('fechados')) animateA = [{left: '20%'}, {left: '40%'}, {left: '60%'}, {left: '80%'}, {left: '100%'}];

            active.animate(animateA,200);

            setTimeout(function(){
                document.querySelectorAll('.borderAba').forEach(function(item){
                    item.classList.remove('active');
                });
                label[0].classList.add('active');
                document.getElementById('fechados').style.display = label[0].classList.contains('fechados') ? "block" : "none";
                document.getElementById('abertos').style.display = label[0].classList.contains('fechados') ? "none" : "block";

            },200);

        }
    };
    $scope.openChat = function(id){
        $rootScope.location('#!/sac/' + id);
    };
    $scope.OpenNewSac = ()=>{
        $('#newSac').css({'display':'block', 'left':'100%'}).animate({left: 0}, 500);
    };
    $scope.CloseNewSac = ()=>{
        $('#newSac').css('display', 'none').animate({left:'100%'}, 1000);
    };
    $scope.saveSac = ()=>{
        Factory.ajax(
            {
                action: 'sac/savesac',
                data: $('#fromnew').serializeArray()
            },
            (data)=> {
                $rootScope.location(`#!/sac/${data.ID}`);
            });
    };
    $scope.setRanking = (element)=>{
        let point = parseInt($(element).data('value'));
        $scope.PONTUACAO_TEMP = $(element).data('value').toString();

        document.querySelectorAll('.setRanking').forEach(item =>{
            $(item).removeClass('pointed').css('color','#fff');
            if(parseInt($(item).data('value')) <= point) $(item).addClass('pointed').css('color','#93b83e');
        });
    }
    $scope.openChamadoAnalise = (button)=>{
        let h4 = $(button).parent().parent().find('.chamado_title');
        let analiseForm = $(button).parent().parent().find('.area_ranking');
        let chamado = $(button).parent().parent();

        $(chamado).css('height', '6em');

        $(button).css('opacity',1).animate({opacity:0}, 500, ()=>{
            $(button).parent().css('display','none');
            $(analiseForm).css({'bottom':'-100%', 'display': 'block'}).animate({bottom: 0}, 500);
            $(chamado).animate({height: '60vh'}, 500);
            $(h4).animate({marginLeft: '36%'}, 500);
        });

    }
    $scope.closeChamadoAnalise = (button)=>{
        let analiseForm = $(button).parent().parent();
        let chamado = $(button).parent().parent().parent();
        let h4 = $(chamado).find('.chamado_title');
        $(analiseForm).animate({bottom:'-100%'}, 500);

        console.log(button );
        $(chamado).animate({height:'6em'}, 500, ()=>{
            $(analiseForm).css('display','none');
            $(chamado).find('.buttonsRanking').css('display','flex');
            $(chamado).find('.buttonsRanking button').animate({opacity:'1'}, 500);
            $(h4).animate({marginLeft: '0'}, 500);
        });
    };
    $scope.saveAnalise = (button)=>{
        let formArea = $(button).parent().parent();
        let showStatus = $(formArea).find('.showstatusR');
        if($(formArea).find('.setRanking').hasClass('pointed')){
            let point = $(formArea).find('.setRanking.pointed').length;
            let idSac = $(formArea).find('.id_sac_fechado').val()
            let text = $(formArea).find('.textcomments').val();

            Factory.ajax(
                {
                    action: 'sac/saveranking',
                    data:{
                        PONTUACAO:point,
                        ID: idSac,
                        COMENTARIOS: text || null

                    }
                },
                (data)=> {
                    $scope.closeChamadoAnalise(button);
                        $scope.FECHADOS.find(item => item.ID == idSac).PONTUACAO = point.toString();
                });
        }else{
            $(showStatus).css({'color':'red','font-size': '12px'}).html('Você precisa avaliar com ao menos 1 estrela');
            setTimeout(()=>{
                $(showStatus).css('display','none');
            },1000)
        }
    }
    $scope.showTypeAnalise = (points) =>{
        let color ='';
        let text = '';
        switch (points) {
            case '1':
                color = "#a22819";
                text="Péssimo";
                break;

            case '2':
                color = "#c00000";
                text="Ruim";
                break;

            case '3':
                color = "#f38c23";
                text="Regular";
                break;

            case '4':
                color = "#5cb341";
                text="Bom";
                break;

            case '5':
                color = "#00713d";
                text="Excelente";
                break;
        }

        return {'color': color, 'text': text};

    }

});
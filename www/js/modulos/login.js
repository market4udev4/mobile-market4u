
app.controller('ConecteSe', function($rootScope, $scope, $routeParams, $q) {
    $rootScope.LogoBody = 1;
    $rootScope.NO_WHATSAPP = false;
    $rootScope.BARRA_SALDO = false;
    $rootScope.Titulo = "";

    $scope.entrar = function () {
        var EMAIL_CPF = $rootScope.usuario.EMAIL_CPF;
        var SENHA = $rootScope.usuario.SENHA;
        var ESQUECEU_SENHA = $rootScope.usuario.ESQUECEU_SENHA;
        if (!$('#formLogin').find('.ng-invalid').length && EMAIL_CPF && (ESQUECEU_SENHA ? true : SENHA)) {
            Factory.ajax(
                {
                    action: 'cadastro/login',
                    form: $('#formLogin'),
                    data: {
                        EMAIL_CPF: $rootScope.usuario.EMAIL_CPF,
                        SENHA: $rootScope.usuario.ESQUECEU_SENHA ? '' : $rootScope.usuario.SENHA,
                        ESQUECEU_SENHA: $rootScope.usuario.ESQUECEU_SENHA ? 1 : 0
                    }
                },
                function (data) {
                    if (data.status == 1) {
                        if(EMAIL_CPF.indexOf('@') !== -1)
                            $rootScope.usuario.EMAIL = EMAIL_CPF;
                        $rootScope.usuario.SENHA = SENHA;
                        $rootScope.usuario.ESQUECEU_SENHA = ESQUECEU_SENHA;
                        $rootScope.usuario.ENVIADO_PARA = data.ENVIADO_PARA;
                    }
                }
            );
        } else if (!EMAIL_CPF || $('#formLogin').find('#email_cpf.ng-invalid').length)
            $('#email_cpf').focus();
        else if (!SENHA || $('#formLogin').find('#senha.ng-invalid').length)
            $('#senha').focus();
    };

    $scope.login = function (action) {
        Factory.ajax(
            {
                action: 'cadastro/' + action
            }
        );
    };
});

app.controller('BoasVindas', function($rootScope, $scope, ReturnData) {
    $rootScope.BARRA_SALDO = false;
    $rootScope.Titulo = "BOAS-VINDAS";
    $rootScope.NO_WHATSAPP = false;
    $scope.CONTENT = ReturnData.CONTENT;
});

app.controller('Cadastro', function($rootScope, $scope) {
    $rootScope.BARRA_SALDO = false;
    $rootScope.LogoBody = 1;
    $rootScope.Titulo = parseInt($rootScope.usuario.ID) ? "PERFIL" : "CADASTRAR-SE";
    $rootScope.NO_WHATSAPP = false;
    $scope.AJUSTES = ($rootScope.usuario.ID?$rootScope.usuario.DADOS_ATUALIZADO:false);

    // Atualizar dados
    if (parseInt($rootScope.usuario.ID) && parseInt(Login.getData().ID) && !parseInt(Login.getData().DADOS_ATUALIZADO)) {
        clearTimeout(Factory.timeout);
        Factory.timeout = setTimeout(function () {
            $rootScope.Titulo = "ATUALIZE SEUS DADOS";
            Factory.alert("Para continuar, por favor atualize seus dados :)");
        }, 500);
    }

    // Disable
    setTimeout(function () {
        if (parseInt($rootScope.usuario.ID)) {
            if ($rootScope.usuario.CPF)
                $('#cpf').attr('disabled', true);
            if ($rootScope.usuario.DATA_NASCIMENTO_FORMAT)
                $('#data_nascimento').attr('disabled', true);
        }
    }, 500);

    $rootScope.ITENS = [];
    var base = config.url_api[config.ambiente];
    $rootScope.ITENS.push({'ACTIVE': 1, 'SRC': base + 'Mobile/www/view/conecte-se/level-dados-pessoais.html'});
    $rootScope.ITENS.push({'ACTIVE': 0, 'SRC': base + 'Mobile/www/view/conecte-se/level-dados-acesso.html'});
    $rootScope.ITENS.push({'ACTIVE': 0, 'SRC': base + 'Mobile/www/view/conecte-se/level-endereco.html'});
    $rootScope.ITENS.push({'ACTIVE': 0, 'SRC': base + 'Mobile/www/view/conecte-se/level-preferencias.html', 'ITENS': $rootScope.usuario.ITENS_PREFERENCIAS});
    if(!$scope.AJUSTES)
        $rootScope.ITENS.push({'ACTIVE': 0, 'SRC': base + 'Mobile/www/view/conecte-se/level-confirmar.html'});
    else {
        if (parseInt($rootScope.usuario.ID))
            $rootScope.ITENS.push({'ACTIVE': 0, 'SRC': base + 'Mobile/www/view/conecte-se/level-termos-politica.html'});
        $rootScope.MenuBottom = true;
    }

    $scope.pref = function (ID) {
        if(!$rootScope.usuario.PREFERENCIAS)
            $rootScope.usuario.PREFERENCIAS = [];
        $rootScope.usuario.PREFERENCIAS[ID] = $rootScope.usuario.PREFERENCIAS[ID] ? 0 : ID;
    };

    $scope.salvar = function () {
        $rootScope.usuario.DDI = 55;
        var USUARIO = $.extend({}, $rootScope.usuario);
        USUARIO.ESTADOS = null;
        USUARIO.STREET = $('#street').val();
        USUARIO.DISTRICT = $('#district').val();
        USUARIO.CITY = $('#city').val();
        USUARIO.STATE = $('#state').val();
        USUARIO.ITENS_PREFERENCIAS = null;
        USUARIO.WHATSAPP = null;
        USUARIO.SET_PREFERENCIAS = [];
        $.each(USUARIO.PREFERENCIAS, function (idx, ID) {
            if(parseInt(ID))
                USUARIO.SET_PREFERENCIAS.push(parseInt(ID));
        });
        USUARIO.PREFERENCIAS = null;
        USUARIO.TERMOS_DE_USO = null;
        USUARIO.POLITICA_DE_PRIVACIDADE = null
        if (parseInt($rootScope.usuario.ID)) {
            var EMAIL = $rootScope.usuario.EMAIL;
            var SENHA = $rootScope.usuario.SENHA;
            Factory.ajax(
                {
                    action: 'cadastro/editar',
                    data: {
                        REDIRECT: $rootScope.REDIRECT || '',
                        usuario: USUARIO,
                        AJUSTES: $scope.AJUSTES ? 1 : 0
                    }
                },
                function (data) {
                    if (data.status == 1) {
                        $rootScope.usuario.CONFIRME_DADOS = 1;
                        $rootScope.usuario.SENHA = SENHA;
                        $rootScope.usuario.EMAIL = EMAIL;
                        $rootScope.usuario.ENVIADO_PARA = data.ENVIADO_PARA;
                        if ($scope.AJUSTES) {
                            $.each($rootScope.ITENS, function (idx, ITEM_IDX) {
                                ITEM_IDX.ACTIVE_AJUSTES = 0;
                            });
                        }
                    }
                }
            );
        } else {
            $rootScope.usuario.NOVO = true;
            Factory.ajax(
                {
                    action: 'cadastro/novo',
                    data: {
                        usuario: USUARIO
                    }
                }, function (data) {
                    if (data.status == 1) {
                        $rootScope.usuario.ENVIADO_PARA = data.ENVIADO_PARA;
                        if (data.redirect_system)
                            $rootScope.REDIRECT = '';
                    }
                }
            );
        }
    };

    $scope.open = function (LEVEL) {
        if($scope.AJUSTES) {
            var active_ajustes = 0;
            $.each($rootScope.ITENS, function (idx, ITEM_IDX) {
                if (ITEM_IDX.ACTIVE_AJUSTES)
                    active_ajustes = 1;
                if (LEVEL == idx) {
                    ITEM_IDX.ACTIVE_AJUSTES = ITEM_IDX.ACTIVE_AJUSTES ? 0 : 1;
                } else {
                    ITEM_IDX.ACTIVE_AJUSTES = 0;
                }
            });
            if (active_ajustes)
                Login.get('#!/conecte-se', 1);
        }
    };

    $rootScope.btnLevel = function (LEVEL, TYPE) {
        if ($rootScope.ITENS.length == LEVEL)
            $scope.salvar();
        else {
            var focus = false;
            if (TYPE == 'NEXT') {
                $('body[controller="Cadastro"] #formCadastro.form #passo-a-passo > li.active input.ng-invalid').each(function () {
                    if (!focus) {
                        focus = true;
                        $(this).focus();
                    }
                });
                $('body[controller="Cadastro"] #formCadastro.form #passo-a-passo > li.active input.ng-invalid2').each(function () {
                    if (!focus) {
                        focus = true;
                        $(this).focus();
                    }
                });
                $('body[controller="Cadastro"] #formCadastro.form #passo-a-passo > li.active input[obg="1"]').each(function () {
                    if (!$(this).val() && !focus) {
                        focus = true;
                        $(this).focus();
                    }
                });
                $('body[controller="Cadastro"] #formCadastro.form #passo-a-passo > li.active select[obg="1"]').each(function () {
                    if (!$(this).val() && !focus) {
                        focus = true;
                        $(this).focus();
                    }
                });
            }
            if (!focus) {
                $.each($rootScope.ITENS, function (idx, ITEM_IDX) {
                    ITEM_IDX.ACTIVE = 0;
                    if (LEVEL == idx) {
                        ITEM_IDX.ACTIVE = 1;
                        if ($('#cardName:visible').length) {
                            $rootScope.usuario.CC_NAME = $('#cardName').val();
                            $rootScope.usuario.CC_NUMBER = $('#cardNumber').val();
                            $rootScope.usuario.CC_MONTHYEAR = $('#expirationMonthYear').val();
                            $rootScope.usuario.CC_CVV = $('#cvv').val();
                            $rootScope.usuario.CC_BANDEIRA = $('#cardBandeira').val();
                        }
                    }
                });
            }
        }
    };
});

app.controller('ConecteSeCodigo', function($rootScope, $scope, $routeParams) {
    if (Page.active) {
        $rootScope.BARRA_SALDO = false;
        $rootScope.Titulo = "Autenticação de dois fatores";

        $scope.reenviarCodSms = function (DATA) {
            var _function = function () {
                Factory.ajax(
                    {
                        action: 'cadastro/sms',
                        data: DATA
                    },
                    function (data) {
                        Factory.alert("Verifique suas mensagens no seu celular!");
                    }
                );
            };
            try {
                navigator.notification.confirm(
                    '',
                    function (buttonIndex) {
                        if (buttonIndex == (Factory.$rootScope.device == 'ios' ? 2 : 1))
                            _function();
                    },
                    'Reenviar código para SMS?',
                    Factory.$rootScope.device == 'ios' ? 'Não,Sim' : 'Sim,Não'
                );
            } catch (e) {
                if (confirm('Enviar código para SMS?'))
                    _function();
            }
        };

        $scope.seguinte = function () {
            Factory.ajax(
                {
                    action: 'login/request',
                    form: $('#formCadastroCodigo'),
                    data: {
                        REDIRECT: $rootScope.REDIRECT || '',
                        EMAIL: $rootScope.usuario.EMAIL,
                        CONFIRME_DADOS: $rootScope.usuario.CONFIRME_DADOS,
                        ESQUECEU_SENHA: $rootScope.usuario.ESQUECEU_SENHA,
                        HASH: $rootScope.usuario.CODIGO,
                        SENHA: $rootScope.usuario.SENHA
                    }
                },
                function (data) {
                    if (data.status == 1)
                        $rootScope.REDIRECT = '';
                }
            );
        };
    } else
        window.history.go(-1);
});

app.controller('CardNew', function($rootScope, $scope, $routeParams) {
    $rootScope.Titulo = "Meus cartões";
    var cc = CC.get();
    $scope.LST = {};
    $.each(cc, function (ID_CC, VALS_CC) {
        VALS_CC.IMG = config.url_api[config.ambiente] + 'skin/default/images/bandeira_cc/' + VALS_CC.BANDEIRA + '.png';
        $scope.LST[ID_CC] = VALS_CC;
    });

    $rootScope.MenuBottom = true;
    $rootScope.NO_WHATSAPP = false;

    $scope.remove = function (ID) {
        var _function = function () {
            var cc_new = {};
            $.each(cc, function (ID_CC, VALS_CC) {
                if (parseInt(ID_CC) != parseInt(ID))
                    cc_new[ID_CC] = VALS_CC;
            });
            $scope.LST = cc = cc_new;
            CC.set(cc_new);
        };
        try {
            navigator.notification.confirm(
                '',
                function (buttonIndex) {
                    if (buttonIndex == (Factory.$rootScope.device == 'ios' ? 2 : 1))
                        _function();
                },
                'Remover cartão de crédito?',
                Factory.$rootScope.device == 'ios' ? 'Não,Sim' : 'Sim,Não'
            );
        } catch (e) {
            if (confirm('Remover cartão de crédito?'))
                _function();
        }
    };
});

app.controller('AddCardNew', function($rootScope, $scope) {
    $rootScope.Titulo = "Adicionar";
    $rootScope.MenuBottom = true;
    $rootScope.NO_WHATSAPP = false;

    $scope.salvar = function () {
        if (!$('#cardName').val().length)
            $('#cardName').focus();
        else if (!$('#cardNumber').val().length)
            $('#cardNumber').focus();
        else if (!$('#expirationMonthYear').val().length)
            $('#expirationMonthYear').focus();
        else if (!$('#cvv').val().length)
            $('#cvv').focus();
        else if (!parseInt($('#formCadastro').attr('invalid'))) {
            var expirationMonthYear = $('#expirationMonthYear').val().toString().split('/');
            var cardData = {
                cardNumber: $('#cardNumber').val().toString().replace(/ /g, ''),
                holderName: $('#cardName').val().toString(),
                securityCode: $('#cvv').val().toString(),
                expirationMonth: expirationMonthYear[0],
                expirationYear: expirationMonthYear[1]
            };
            var checkout = new DirectCheckout(Login.getData().JUNO.public, Login.getData().JUNO.production);
            if (checkout.isValidCardNumber(cardData.cardNumber)) {
                if (checkout.isValidExpireDate(cardData.expirationMonth, '20' + cardData.expirationYear)) {
                    if (checkout.isValidSecurityCode(cardData.cardNumber, cardData.securityCode)) {
                        CC.add(cardData, checkout.getCardType(cardData.cardNumber));
                        $rootScope.location('#!/card-new');
                    } else {
                        $('#cvv').focus();
                        $rootScope.dadosInvalidosCC('Cód. de segurança inválido');
                    }
                } else {
                    $('#expirationMonthYear').focus();
                    $rootScope.dadosInvalidosCC('Validade inválido');
                }
            } else {
                $('#cardNumber').focus();
                $rootScope.dadosInvalidosCC('Número do cartão inválido');
            }
        } else
            $rootScope.dadosInvalidosCC();
    };
});

app.controller('MinhaCarteira', function($rootScope, $scope, $routeParams, ReturnData) {
    $rootScope.BARRA_SALDO = false;
    $rootScope.Titulo = "Minha Carteira";
    $rootScope.NO_WHATSAPP = false;
    $rootScope.FORMA_PAGAMENTO = null;

    // PagSeguro
    $.each(ReturnData.FORMAS_PG, function (idx, f_pg) {
        switch (f_pg.GATEWAY) {
            case 'PAGSEGURO':
                $rootScope.pagseguro(0, null, 1000);
                break;
            case 'JUNO':
                var cc = CC.get();
                var active = 1;
                var count = 0;
                ReturnData.FORMAS_PG[idx]['LST'] = [];
                $.each(cc, function (ID, vals) {
                    ReturnData.FORMAS_PG[idx]['LST'].push({
                        ACTIVE: active,
                        ID: ID,
                        IMG: config.url_api[config.ambiente] + "skin/default/images/bandeira_cc/" + vals.BANDEIRA + ".png",
                        TEXT: vals.TEXT,
                        VALS: {1: vals.HASH}
                    });
                    active = 0;
                    count++;
                });
                if (count) {
                    ReturnData.FORMAS_PG[idx]['LST'].push({
                        'ID': 0,
                        'ACTIVE': 0,
                        'TEXT': 'Novo cartão'
                    });
                }
                break;
        }
    });

    $rootScope.FORMAS_PG = ReturnData.FORMAS_PG;

    $rootScope.VALOR_PG = 50;
    $scope.itens = [
        {
            value: 30,
        },
        {
            value: 50,
            active: 1,
            popular: 1
        },
        {
            value: 70,
        },
        {
            value: 100,
        },
        {
            value: 150,
        },
        {
            value: 300,
        }
    ];

    $scope.select = function (item) {
        $.each($scope.itens, function (idx, item_each) {
            item_each.active = 0;
        });
        item.active = 1;
        $rootScope.VALOR_PG = item.value;
    };
});

app.controller('VoucherLst', function($rootScope, $scope, $route, $routeParams, ReturnData) {
    $rootScope.border_top = 1;
    $rootScope.Titulo = "Cupons de desconto";
    $scope.LST = ReturnData.LST;

    $scope.click = function(reg) {
        $rootScope.location('#!/voucher/' + reg.ID);
    };

    $rootScope.ADD_VOUCHER = '';
    $scope.addVoucher = function () {
        if($rootScope.ADD_VOUCHER || '') {
            Factory.ajax(
                {
                    action: 'cadastro/addvoucher',
                    data: {
                        ADD_VOUCHER: $rootScope.ADD_VOUCHER
                    }
                },
                function (data) {
                    if (data.ATUALIZAR) {
                        $rootScope.ADD_VOUCHER = '';
                        $route.reload();
                    }
                }
            );
        }else
            $('#ADD_VOUCHER').focus();
    };
});

app.controller('VoucherGet', function($rootScope, $scope, $routeParams, ReturnData) {
    $rootScope.border_top = 1;
    $rootScope.Titulo = "Voucher - Detalhes";
    $rootScope.NO_WHATSAPP = false;
    $scope.REG = ReturnData;

    $scope.utilizarVoucher = function (CODIGO) {
        Factory.ajax(
            {
                action: 'cadastro/addvoucher',
                data: {
                    ADD_VOUCHER: CODIGO
                }
            },
            function (data) {
                if (data.ATUALIZAR)
                    $rootScope.location('#!/historico-transacoes');
            }
        );
    };
});

app.controller('HistoricoTransacoesLst', function($rootScope, $scope, $routeParams, ReturnData) {
    $rootScope.border_top = 1;
    $rootScope.Titulo = "Compras";
    $scope.LST = ReturnData.LST;

    $scope.click = function(reg) {
        $rootScope.location('#!/historico-transacoes/' + reg.ID);
    };
});

app.controller('HistoricoTransacoesGet', function($rootScope, $scope, $routeParams, ReturnData) {
    $rootScope.border_top = 1;
    $rootScope.Titulo = "Compras";
    $rootScope.WHATSAPP = ReturnData.WHATSAPP.url;
    $scope.REG = ReturnData;

    $scope.estornar = function() {
        $rootScope.location('#!/pedido-estorno/' + ReturnData.ID);
    };

    $scope.redirecionarParaSac = function () {
        $rootScope.location('#!/sac/' + ReturnData.SAC);
    };
});

app.controller('EstornoItensPedidoGet', function ($rootScope, $scope, $routeParams, ReturnData) {
    $rootScope.border_top = 1;
    $rootScope.Titulo = "Estorno";
    $rootScope.NO_WHATSAPP = false;
    $rootScope.VALOR_TOTAL_ESTORNO = 0;
    $rootScope.PEDIDO = ReturnData.PEDIDO;

    $scope.calcularKG = function(produto) {
        if(produto.UNIDADE_MEDIDA === 'KG') {
            if(produto.ITEMESTORNO === true) {
                produto.QTDE_ESTORNO = produto.QTDE;
                produto.VALOR_ESTORNO = produto.UNITARIO;
                $rootScope.VALOR_TOTAL_ESTORNO += produto.UNITARIO;
            }else{
                produto.QTDE_ESTORNO = 0;
                produto.VALOR_ESTORNO = 0;
                $rootScope.VALOR_TOTAL_ESTORNO -= produto.UNITARIO;
            }
        }else{
            if(produto.ITEMESTORNO === false) {
                $rootScope.VALOR_TOTAL_ESTORNO -= (produto.UNITARIO * produto.QTDE_ESTORNO);
                produto.QTDE_ESTORNO = 0;
                produto.VALOR_ESTORNO = 0;
            }
        }
    };

    $scope.addQtdeProduto = function (produto) {
        if(produto.QTDE_ESTORNO < produto.QTDE) {
            produto.QTDE_ESTORNO = parseInt(produto.QTDE_ESTORNO) + 1;
            produto.VALOR_ESTORNO = produto.UNITARIO * produto.QTDE_ESTORNO;
            $rootScope.VALOR_TOTAL_ESTORNO += produto.UNITARIO * produto.QTDE_ESTORNO;
        }
    };

    $scope.removeQtdeProduto = function (produto) {
        if(produto.QTDE_ESTORNO > 0) {
            $rootScope.VALOR_TOTAL_ESTORNO -= (produto.UNITARIO * produto.QTDE_ESTORNO);
            produto.QTDE_ESTORNO = parseInt(produto.QTDE_ESTORNO) - 1;
            produto.VALOR_ESTORNO = produto.UNITARIO * produto.QTDE_ESTORNO;
        }
    };

    $scope.solicitarEstorno = function (pedido) {
        $scope.data = pedido.PRODUTOS.filter(function (item) {
            return item.ITEMESTORNO === true;
        });

        if($scope.data.length) {
            pedido.NENHUM = false;

            var validador = $scope.validarDados(pedido.MOTIVO, $scope.data);

            pedido.PRODUTOS.map(function (produto)
            {
                produto.ERRO_QTD_ESTORNO = !!validador.PRODUTOS.find(element => element === produto.PRODUTOID);
            });

            pedido.MOTIVO_NULO = validador.MOTIVO === true;

            if(validador.MOTIVO !== true && validador.PRODUTOS.length <= 0) {
                try {
                    navigator.notification.confirm('',
                        function (buttonIndex) {
                            if (buttonIndex == (Factory.$rootScope.device == 'ios' ? 2 : 1)) {
                                $scope.enviarSolicitacaoEstorno(pedido);
                            }
                        },
                        'Realmente deseja fazer esta solicitação de estorno?',
                        Factory.$rootScope.device == 'ios' ? 'Não,Sim' : 'Sim,Não'
                    );
                } catch (e) {
                    if (confirm('Realmente deseja fazer esta solicitação de estorno?')) {
                        $scope.enviarSolicitacaoEstorno(pedido);
                    }
                }
            }else{
                $('.scrollable').animate({scrollTop: 0}, 1000);
            }
        }else{
            pedido.PRODUTOS.map(function (produto) {
                produto.ERRO_QTD_ESTORNO = false;
            });

            pedido.NENHUM = true;

            $('.scrollable').animate({scrollTop: 0}, 1000);
        }
    };

    $scope.validarDados = function (motivo, produtosParaEstorno) {
        var errors, erroMotivo = false, errorsProduto = [];

        produtosParaEstorno.map(function (value) {
            if(value.UNIDADE_MEDIDA === 'KG') value.QTDE_ESTORNO = value.QTDE;
            if(value.QTDE_ESTORNO <= 0 && value.UNIDADE_MEDIDA !== 'KG') errorsProduto.push(value.PRODUTOID);
        });

        if(motivo === undefined || motivo.length <= 3) erroMotivo = true;

        errors = {"MOTIVO" : erroMotivo, "PRODUTOS" : errorsProduto};

        return errors;
    };

    $scope.enviarSolicitacaoEstorno = function (pedido) {
        Factory.ajax({
                action: 'estorno/solicitarestorno',
                data: {
                    'PEDIDO' : {
                        'ID'        : pedido.ID,
                        'DATAHORA'  : pedido.DATAHORA,
                        'MOTIVO'    : pedido.MOTIVO,
                        'PRODUTOS'  : JSON.stringify($scope.data)
                    }
                }
            },
            function (data) {
                if (data.status === 0){
                    $rootScope.PEDIDO.ERROESTORNO = true;
                    $rootScope.PEDIDO = '';

                }else if (data.status === 1){
                    window.history.go(-1);

                }else if(data.status === 2){
                    $rootScope.PEDIDO = data.PEDIDO;

                }
            }
        );
    }
});

app.controller('NotificacoesLst', function($rootScope, $scope, $routeParams, ReturnData) {
    $rootScope.border_top = 1;
    $rootScope.Titulo = "Notificações";
    $scope.LST = ReturnData.LST;

    $scope.click = function(reg) {
        $rootScope.location('#!/notificacoes/' + reg.ID);
    };
});

app.controller('NotificacoesGet', function($rootScope, $scope, $routeParams, ReturnData) {
    $rootScope.border_top = 1;
    $rootScope.Titulo = ReturnData.TITULO?ReturnData.TITULO:'Não encontrado';
    $scope.REG = ReturnData;
});

function fotoCadastro(){
    $('#fotoCadastro').change(function(){
        var _campo = $(this);

        //Limite default de 80MB para todos os arquivos menos xlsx e xls.
        var _maxsize = 102400000;
        var _maxsize_msg = 100;

        //Verifica se existe limitação no campo e converte o valor de MB para bytes.
        if(parseInt(_campo.data('maxsize'))){
            _maxsize = parseInt(_campo.data('maxsize')) * 1048576;
            _maxsize_msg = parseInt(_campo.data('maxsize'));
        }

        var i = 0, len = this.files.length;
        for ( ; i < len; i++ ){
            var file = this.files[i];
            var _ok = true;

            var _name_split     = file.name.split('.');
            var _ext            = _name_split[_name_split.length - 1].toLowerCase();

            if(file.size > _maxsize) {
                Factory.alert('Arquivo muito grande, utilizar menor ou igual a ' + _maxsize_msg + 'MB!');
                _campo.val('');
                _ok = false;
            }

            if(_ok === true && _campo.data('ext')){
                var _ext_permitidos = _campo.data('ext').split(',');
                if(_ext_permitidos.indexOf(_ext) == -1){
                    Factory.alert('Tipo de arquivo não aceito. Utilizar:'+' '+_campo.data('ext'));
                    _campo.val('');
                    _ok = false;
                }
            }

            if(_ok) {
                clearTimeout(Factory.timeout);
                Factory.timeout = setTimeout(function(){
                    Factory.ajax(
                        {
                            action: 'cadastro/imagem',
                            data: {
                                IMAGEM: file
                            }
                        },function(){
                            Login.get();
                        }
                    );
                    var oFReader = new FileReader();
                    oFReader.readAsDataURL(file);
                    oFReader.onload = function (oFREvent) {
                        document.getElementById('fotoCadastroImg').src = oFREvent.target.result;
                        $('#fotoCadastroImg').show();
                    };
                }, 1000);
            }
        }
    });
}
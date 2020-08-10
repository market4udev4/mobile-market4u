try {
    app.controller('Main', function ($rootScope, $scope, $http, $routeParams, $route, $mdSelect, $animate, $sce, deviceDetector) {
        $rootScope.usuario = Login.getData();
        $rootScope.new_iphone = 0;
        $rootScope.QTDE_PUSH = 0;
        Factory.prepare();

        $scope.getWifi = function(){
           $rootScope.wifi_nome = localStorage.getItem("WIFI_NOME");
           $rootScope.wifi_senha = localStorage.getItem("WIFI_SENHA");
        };

        setTimeout(function(){
            $('#carregando').attr('ok', 1);
        }, 2000);

        $rootScope.device = deviceDetector.os;
        $rootScope.BASE = config.url_api[config.ambiente] + 'Mobile/www/';

        $rootScope.versao_app_mobile = config.versao_app_mobile;
        $rootScope.REDIRECT = '';
        Factory.$http = $http;
        Factory.$rootScope = $rootScope;

        // Get login
        Login.get();

        // Finalizar compra
        $scope.fecharCompra = function () {
            var tentativas = 0;
            $('#carregando').css('display', 'flex').css('opacity', 1);
            var fecharCompra = function () {
                tentativas++;
                try {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            function (position) {
                                Factory.ajax(
                                    {
                                        action: 'options/token',
                                        data: {
                                            TOKEN: 'fecharcompra',
                                            COORDS: position.coords
                                        }
                                    }, function (data) {
                                        $rootScope.transacaoIdCarrinho = true;
                                        $rootScope.transacaoId = parseInt(data.TRANSACAO_ID);
                                        if (data.url)
                                            $rootScope.location(data.url);
                                    }
                                );
                            },
                            function () {
                                fecharCompraError();
                            },
                            {
                                enableHighAccuracy: true,
                                timeout: 5000,
                                maximumAge: 0
                            }
                        );
                    } else {
                        fecharCompraError();
                    }
                } catch (e) {
                    fecharCompraError();
                }
            };
            var fecharCompraError = function () {
                if (tentativas <= 10)
                    fecharCompra();
                else {
                    $('#carregando').css('opacity', 0).hide();
                    Factory.alert(Location.msg);
                    if ("cordova" in window)
                        Location.checkState();
                }
            };
            var msg = 'Confirma o local de compra: ' + $rootScope.LOCAL.ITEM.NOME + ' ?';
            try {
                navigator.notification.confirm(
                    '',
                    function (buttonIndex) {
                        if (buttonIndex == ($rootScope.device == 'ios' ? 2 : 1))
                            fecharCompra();
                        else {
                            $('#carregando').css('opacity', 0).hide();
                            $rootScope.clickItem('busca_locais');
                        }
                    },
                    msg,
                    $rootScope.device == 'ios' ? 'Não,Sim' : 'Sim,Não'
                );
            } catch (e) {
                if (confirm(msg))
                    fecharCompra();
                else {
                    $('#carregando').css('opacity', 0).hide();
                    $rootScope.clickItem('busca_locais');
                }
            }
        };

        $rootScope.LOCAL = [];
        $rootScope.location = function (url, external, active) {
            switch (url) {
                case '#!/index/3':
                    active = true;
                    break;
            }
            if (active)
                Page.start();
            if (parseInt(external)) {
                $rootScope.swipeLeft();
                Factory.AppBrowser(url.url, url);
            } else {
                switch (url) {
                    case '#!/':
                        if (!parseInt(Login.getData().ID))
                            url = '#!/conecte-se';
                        break;
                    case '#!/minha-carteira':
                    case '#!/cadastro':
                        if ((!parseInt(Login.getData().ID) && !Page.active)) {
                            $rootScope.REDIRECT = btoa(url);
                            url = '#!/conecte-se';
                        } else if (url == '#!/minha-carteira' && parseInt(Login.getData().ID) && !parseInt(Login.getData().DADOS_ATUALIZADO)) {
                            $rootScope.REDIRECT = btoa(url);
                            url = '#!/cadastro';
                        }
                        break;
                }

                if (url.indexOf('#!/conecte-se') !== -1
                    || url.indexOf('#!/conecte-se-codigo') !== -1)
                    Page.start();

                window.location = url;
                if (url == '#!/') {
                    if (parseInt(Login.getData().ID))
                        $('#toolbar > img').hide();
                    $rootScope.swipeLeft();
                    $rootScope.toolbar = true;
                    $rootScope.PROD_DETALHES = false;
                    $rootScope.CARRINHO = false;
                    $rootScope.TIPO_PG = 'COMPRAR';
                    $rootScope.PESQUISA = '';
                    $rootScope.MenuBottom = true;
                    $rootScope.PRODUTOS_CATEGORIAS_BUSCA = [];
                    $rootScope.LOCAL.ATIVO = false;
                    $('#boxProdutos').scrollTop(0);
                }
                if (url != '#!/conecte-se' && url != '#!/boas-vindas' && url != '#!/')
                    $route.reload();
            }
        };

        $scope.to_trusted = function (html_code) {
            return $sce.trustAsHtml(html_code);
        };

        $rootScope.NO_WHATSAPP = true;
        $rootScope.BARRA_SALDO = true;
        $rootScope.MenuBottom = 0;
        $rootScope.TOUR = 0;
        $rootScope.CARRINHO = 0;
        $rootScope.top_0 = 0;
        $rootScope.$on('$routeChangeStart', function () {
            $rootScope.BARRA_SALDO = true;
            $rootScope.MenuBottom = 0;
            $rootScope.TOUR = 0;
            $rootScope.CARRINHO = 0;
            $rootScope.top_0 = 0;
            $rootScope.menuClose();
        });

        $rootScope.controller = 'Index';
        $rootScope.$on('$routeChangeSuccess', function () {
            $('body > .app').show();
            $('a#whatsapp, #carregando').removeAttr('style');
            $rootScope.NO_WHATSAPP = true;
            $rootScope.border_top = 0;
            $rootScope.toolbar = true;
            if ($route.current) {
                switch ($route.current.controller) {
                    case 'ConecteSe':
                    case 'Cadastro':
                    case 'Suporte':
                    case 'Command':
                    case 'SemInternet':
                    case 'AtualizarApp':
                    case 'Faq':
                    case 'Token':
                    case 'BoasVindas':
                    case 'ConecteSeCodigo':
                        break;
                    default:
                        clearTimeout(Factory.timeout);
                        Factory.timeout = setTimeout(function () {
                            if (parseInt(Login.getData().ID)) {
                                if (parseInt(Login.getData().DADOS_ATUALIZADO)) {
                                    if (!parseInt(Login.getData().BOAS_VINDAS))
                                        $rootScope.location('#!/boas-vindas');
                                    else if (!parseInt(Login.getData().TOUR))
                                        $rootScope.location('#!/index/TOUR', false, true);
                                } else
                                    $rootScope.location('#!/cadastro');
                            } else
                                $rootScope.location('#!/conecte-se');
                        }, 1000);
                        break;
                }
                $rootScope.controller = $route.current.controller;
                if ($rootScope.controller != 'Index' || (parseInt($routeParams.STEP) ? parseInt($routeParams.STEP) : 1) == 1)
                    Payment.clear(1);

                // Destravar
                if ($route.current.controller != 'Command') {
                    clearInterval(bluetooth.timeout);
                    bluetooth.disconnect();
                }
            }
        });

        $rootScope.trustAsHtml = function (string) {
            return $sce.trustAsHtml(string);
        };

        $rootScope.AppBrowser = function (open_browser) {
            if (open_browser.url)
                Factory.AppBrowser(open_browser.url, open_browser);
        };

        $rootScope.AcessoRestrito = function (url, params) {
            if (url && $rootScope.usuario.RESTRITO) {
                Factory.ajax(
                    {
                        action: 'arearestrito/hash'
                    },
                    function (data) {
                        if (data.HASH) {
                            params = params ? params : {};
                            params['PHPSESSID'] = localStorage.getItem("PHPSESSID");
                            params['HASH'] = btoa(
                                JSON.stringify(
                                    {
                                        'ID': $rootScope.usuario.RESTRITO,
                                        'HASH': data.HASH
                                    }
                                )
                            );
                            Factory.AppBrowser(
                                data.BROWSER.url + (url != '/' ? url : '') + '?' + $.param(params),
                                data.BROWSER
                            );
                        }
                    }
                );
            }
        };

        $rootScope.TEXT_WHATSAPP = '';
        $rootScope.WHATSAPP = '';
        $rootScope.whatsapp = function (url) {
            if ($rootScope.usuario.WHATSAPP.ATIVO) {
                Factory.AppBrowser(
                    url + $rootScope.TEXT_WHATSAPP,
                    $rootScope.usuario.WHATSAPP
                );
            }
        };

        $rootScope.logout = function () {
            Login.logout();
            $rootScope.location('#!/conecte-se');
        };

        $rootScope.backpageTop = function () {
            if ($rootScope.controller == 'Cadastro') {
                var level = parseInt($('#formCadastro.form #passo-a-passo > li.active').attr('level'));
                if (level) {
                    $rootScope.btnLevel(level - 1);
                    return;
                } else if ($rootScope.usuario.ID && !$rootScope.usuario.DADOS_ATUALIZADO) {
                    $rootScope.logout();
                    return;
                }
               }
            if ($rootScope.controller == 'SacLst'){
                if($('#newSac').hasClass('opened_sacnew')){
                    $('#newSac').animate({left: '-100%'}, 400,()=>{
                        $('#newSac').removeClass('opened_sacnew').css('display', 'none');
                    })
                    return;
                }
                if($('.fechados').hasClass('active')){
                    $rootScope.TransitionAbas(document.querySelectorAll('div.abertos.abs')[0]);
                    return;
                }
            }
            $('.scrollable:first').attr('backpage', 1);
            window.history.go(-1);
        };

        $rootScope.clickMenu = function (type, valor) {
            switch (type) {
                case 'inicio':
                    if ($rootScope.TOUR)
                        $rootScope.TOUR = 2;
                    else
                        $rootScope.location('#!/');
                    break;
                case 'carteira':
                    if ($rootScope.TOUR)
                        $rootScope.TOUR = 3;
                    else
                        $rootScope.location('#!/minha-carteira');
                    break;
                case 'pagar_escanear':
                    if ($rootScope.TOUR)
                        $rootScope.TOUR = 4;
                    else {
                        if ($rootScope.TIPO_PG == 'PAGAMENTO')
                            $rootScope.clickEscanear('qrcode');
                        else
                            $rootScope.clickEscanear('comprar');
                    }
                    break;
                case 'destravar_15048_fechar':
                    $rootScope.CAMBIRELLA = false;
                    break;
                case 'destravar_15048':
                    if ($rootScope.TOUR)
                        $rootScope.TOUR = 5;
                    else
                        $rootScope.CAMBIRELLA = true;
                    break;
                case 'destravar_15028_fechar':
                    $rootScope.PDV_1 = false;
                    break;
                case 'destravar_15028':
                    if ($rootScope.TOUR)
                        $rootScope.TOUR = 5;
                    else
                        $rootScope.PDV_1 = true;
                    break;
                case 'destravar':
                    if ($rootScope.TOUR)
                        $rootScope.TOUR = 5;
                    else {
                        switch (valor) {
                            case 2: // Bebidas normais
                                bluetooth.detravar(1, 2);
                                break;
                            case 3: // Resfriados
                                bluetooth.detravar(1, 3);
                                break;
                            case 4: // Adega
                                bluetooth.detravar(1, 4);
                                break;
                            case 1: // Bebidas alcolicas
                            default:
                                if (parseInt(Login.getData().MAIOR_18_ANOS)) {
                                    if (Login.getData().DESTRAVAR_AVISO)
                                        Factory.alert(Login.getData().DESTRAVAR_AVISO);
                                    else
                                        bluetooth.detravar(1, valor == 1 ? 1 : null);
                                } else {
                                    Factory.alert('Proibida a venda de bebidas alcoólicas para menores de 18 anos!');
                                    $rootScope.location('#!/command/18+/destravar/VENDA_BEBIDA_PROIBIDA', 0, 1);
                                }
                                break;
                        }
                    }
                    break;
                case 'ajustes':
                    if ($rootScope.TOUR)
                        $rootScope.TOUR = 6;
                    else
                        $rootScope.location('#!/cadastro');
                    break;
            }
        };

        $rootScope.swipeLeft = function () {
            $rootScope.menuClose();
        };

        $rootScope.swipeRight = function () {
            if (!$('[ng-controller="Modal"]').is(':visible'))
                $rootScope.menuOpen();
        };

        // Menu
        $rootScope.MenuLeft = [
            {
                titulo: 'Produtos',
                controller: 'Index',
                url: '#!/',
                icon: 'mdi-action-store',
                logado: 1
            },
            {
                titulo: 'Compras',
                controller: 'HistoricoTransacoesLst',
                url: '#!/historico-transacoes',
                icon: 'mdi-action-history',
                logado: 0
            },
            {
                id: 'PUSH',
                titulo: 'Notificações',
                controller: 'NotificacoesLst',
                url: '#!/notificacoes',
                icon: 'mdi-social-notifications-none',
                logado: 0
            },
            {
                titulo: 'Cupons de desconto',
                controller: 'VoucherLst',
                url: '#!/voucher',
                icon: 'mdi-action-loyalty',
                logado: 0
            },
            {
                titulo: 'Minha carteira',
                controller: 'MinhaCarteira',
                url: '#!/minha-carteira',
                icon: 'mdi-editor-attach-money',
                logado: 0
            },
            {
                titulo: 'Meus cartões',
                controller: 'Card',
                url: '#!/card-new',
                icon: 'mdi-action-credit-card',
                logado: 0
            },
            {
                titulo: 'Tour pelo app',
                url: '#!/index/TOUR',
                icon: 'mdi-image-remove-red-eye',
                logado: 0,
                pageStart: 1
            },
            {
                id: 'PS',
                titulo: 'Pesquisa de Satisfação',
                external: 1,
                url: {
                    url: 'https://docs.google.com/forms/d/e/1FAIpQLSf2oEEwGaFyyIq55rcDTXzwc4OsFVX-dow-xgKiTxG5c0TcGA/viewform'
                },
                icon: 'mdi-action-grade',
                logado: 0
            },
            {
                titulo: 'Posso ajudar?',
                controller: 'Suporte',
                url: '#!/suporte',
                icon: 'mdi-hardware-headset',
                logado: 1
            }

        ];

        var menuClose_time = null;
        $rootScope.menuOpen = function () {
            clearTimeout(menuClose_time);
            $('#fundo_transparente').show();
            $('body').attr('menu_left', 1);
        };
        $rootScope.menuClose = function () {
            menuClose_time = setTimeout(function () {
                $('#fundo_transparente').hide();
            }, 1000);
            $('body').removeAttr('menu_left');
        };

        $rootScope.formatValor = function (text) {
            return String(text).replace('.', ',');
        };

        /*
         * Payment
         */
        $rootScope.dadosInvalidosCC = function (msg) {
            Factory.alert(msg ? msg : 'Dados de cartão de créditos inválidos!');
            $('#carregando').hide().css('opacity', 0);
            $('.btnConfirme').attr('disabled', false);
        };
        $rootScope.pagseguro = function (paymentPagSeguro, origem, time) {
            time = time ? time : 0;
            if (!$('#api_pagseguro').length) {
                time = 3000;
                $('body').append('<script id="api_pagseguro" onerror="semInternet()" src="https://stc.pagseguro.uol.com.br/pagseguro/api/v2/checkout/pagseguro.directpayment.js"></script>');
            }
            $(document).ready(function () {
                clearTimeout(Factory.timeout);
                Factory.timeout = setTimeout(function () {
                    $rootScope.PAGSEGURO_SESSIONID = null;
                    try {
                        Factory.ajax(
                            {
                                action: 'payment/pagseguro'
                            },
                            function (data) {
                                if (data.SESSIONID) {
                                    $rootScope.PAGSEGURO_SESSIONID = data.SESSIONID;
                                    PagSeguroDirectPayment.setSessionId($rootScope.PAGSEGURO_SESSIONID);
                                    if (parseInt(paymentPagSeguro))
                                        $rootScope.paymentPagSeguro(origem);
                                }
                            }
                        );
                    } catch (e) {

                    }
                }, time);
            });
        };
        var verifyLimitFormasPg = null;
        $rootScope.verifyLimitFormasPg = function () {
            if ($rootScope.transacaoId) {
                clearTimeout(verifyLimitFormasPg);
                verifyLimitFormasPg = setTimeout(function () {
                    Factory.ajax(
                        {
                            action: 'payment/confirm',
                            data: {
                                VERIFICA_LIMITE_FORMAS_PG: 1,
                                UTILIZADO_SALDO: $rootScope.ACTIVE_SALDO ? 1 : 0,
                                VOUCHER: $rootScope.VOUCHER || 0,
                                TRANSACAO_ID: $rootScope.transacaoId
                            }
                        },
                        function (data) {
                            $rootScope.VALOR_PG = parseFloat(data.VALOR_PG || 0);
                            $rootScope.VALOR_PG_FORMAT = data.VALOR_PG_FORMAT;
                            $rootScope.VALOR_CASHBACK = data.VALOR_CASHBACK;
                            $rootScope.CASHBACK_TEXTO = data.CASHBACK_TEXTO;
                            $rootScope.TOTAL_DE = data.TOTAL_DE;
                            $rootScope.TOTAL_POR = data.TOTAL_POR;
                            $rootScope.TOTAL_DESCONTO = data.TOTAL_DESCONTO;
                            $rootScope.PRODUTOS = data.PRODUTOS;
                        }
                    );
                }, 50);
            }
        };
        $rootScope.selectFormaPg = function (PG) {
            if (PG.ACTIVE) {
                if (!$('#boxCC:hover').length) {
                    PG.ACTIVE = 0;
                    $rootScope.FORMA_PAGAMENTO = null;
                    $rootScope.CARD = null;
                }
            } else {
                if (PG.TIPO != 'SALDO' && PG.TIPO != 'VOUCHER') {
                    $.each($rootScope.FORMAS_PG, function (idx, item_each) {
                        item_each.ACTIVE = 0;
                    });
                    if (PG.TIPO == 'CC' || PG.TIPO == 'MCC' || PG.TIPO == 'JCC') {
                        if (PG.LST.length) {
                            $.each(PG.LST, function (idx_cc, item_each_cc) {
                                if (item_each_cc.ACTIVE)
                                    $rootScope.CARD = item_each_cc.VALS;
                            });
                        }else
                            $rootScope.CARD = null;
                    }
                    PG.ACTIVE = 1;
                    $rootScope.FORMA_PAGAMENTO = PG;
                    setTimeout(function () {
                        $('#cardNumber').focus().blur();
                    }, 100);
                }
            }
            if (PG.TIPO == 'SALDO' && $('label:hover').length) {
                $rootScope.VALOR_PG_FORMAT = '--';
                $rootScope.ACTIVE_SALDO = PG.ACTIVE_SALDO ? 0 : 1;
                PG.ACTIVE_SALDO = $rootScope.ACTIVE_SALDO;
                $rootScope.verifyLimitFormasPg();
            }
        };
        $rootScope.paymentPagSeguro = function (origem) {
            if (parseInt($rootScope.FORMA_PAGAMENTO.CC)) {
                PagSeguroDirectPayment.getBrand({
                    cardBin: $rootScope.FORMA_PAGAMENTO.cardNumber.toString().replace(/ /g, '').substring(0, 6),
                    success: function (bandeira) {
                        var expirationMonthYear = $rootScope.FORMA_PAGAMENTO.expirationMonthYear.toString().split('/');
                        var data = {
                            cardNumber: $rootScope.FORMA_PAGAMENTO.cardNumber.toString().replace(/ /g, ''),
                            brand: bandeira.brand.name,
                            cvv: $rootScope.FORMA_PAGAMENTO.cvv.toString(),
                            expirationMonth: expirationMonthYear[0],
                            expirationYear: '20' + expirationMonthYear[1],
                            success: function (data) {
                                if (data.card.token) {
                                    $rootScope.processPayment(
                                        origem,
                                        {
                                            PAGSEGURO_HASH: PagSeguroDirectPayment.getSenderHash(),
                                            PAGSEGURO_TOKEN: data.card.token
                                        }
                                    );
                                } else
                                    $rootScope.dadosInvalidosCC();
                            },
                            error: function (error) {
                                $rootScope.dadosInvalidosCC();
                            }
                        };
                        PagSeguroDirectPayment.createCardToken(data);
                    },
                    error: function (error) {
                        $rootScope.dadosInvalidosCC();
                    }
                });
            } else {
                $rootScope.processPayment(
                    origem,
                    {
                        PAGSEGURO_HASH: PagSeguroDirectPayment.getSenderHash()
                    }
                );
            }
        };
        $rootScope.paymentJuno = function (origem) {
            if (parseInt($rootScope.FORMA_PAGAMENTO.CC)) {
                try {
                    var expirationMonthYear = $rootScope.FORMA_PAGAMENTO.expirationMonthYear.toString().split('/');
                    var checkout = new DirectCheckout(Login.getData().JUNO.public, Login.getData().JUNO.production);
                    var cardData = {
                        cardNumber: $rootScope.FORMA_PAGAMENTO.cardNumber.toString().replace(/ /g, ''),
                        holderName: $rootScope.FORMA_PAGAMENTO.cardName.toString(),
                        securityCode: $rootScope.FORMA_PAGAMENTO.cvv.toString(),
                        expirationMonth: expirationMonthYear[0],
                        expirationYear: '20' + expirationMonthYear[1]
                    };
                    if (checkout.isValidCardNumber(cardData.cardNumber)) {
                        if (checkout.isValidExpireDate(cardData.expirationMonth, cardData.expirationYear)) {
                            if (checkout.isValidSecurityCode(cardData.cardNumber, cardData.securityCode)) {
                                checkout.getCardHash(
                                    cardData,
                                    function (cardHash) {
                                        if (cardHash) {
                                            $rootScope.processPayment(
                                                origem,
                                                {
                                                    HASH: cardHash
                                                },
                                                cardData,
                                                checkout.getCardType(cardData.cardNumber)
                                            );
                                        } else
                                            $rootScope.dadosInvalidosCC();
                                    },
                                    function (error) {
                                        $rootScope.dadosInvalidosCC();
                                    }
                                );
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
                } catch (e) {
                    console.log(e);
                    $rootScope.dadosInvalidosCC('Ocorreu um erro inesperado. Tente novamente ou favor entrar em contato conosco!');
                }
            } else
                $rootScope.processPayment(origem);
        };
        var clearTimeoutProcessPayment = null;
        $rootScope.processPayment = function (origem, extra, cardData, bandeira) {
            clearTimeout(clearTimeoutProcessPayment);
            clearTimeoutProcessPayment = setTimeout(function () {
                var forma_pagamento = Object.assign({}, $rootScope.FORMA_PAGAMENTO);
                forma_pagamento.LST = null;
                forma_pagamento.$$hashKey = null;
                if (parseInt(forma_pagamento.CC) && forma_pagamento.GATEWAY == 'JUNO') {
                    forma_pagamento.cardNumber = null;
                    forma_pagamento.expirationMonthYear = null;
                    forma_pagamento.cvv = null;
                    forma_pagamento.cardName = null;
                }
                var submitPayment = function () {
                    switch (origem) {
                        case 'saldo':
                            Factory.ajax(
                                {
                                    action: 'cadastro/addsaldo',
                                    data: {
                                        FORMA_PAGAMENTO: forma_pagamento,
                                        VALOR_PG: $rootScope.VALOR_PG,
                                        EXTRA: extra
                                    }
                                },
                                function (data) {
                                    $('.btnConfirme').attr('disabled', false);

                                    /*
                                     * Salvar cartao
                                     */
                                    if (parseInt(data.status) == 1) {
                                        if(parseInt(data.pago)){
                                            $('#boxPago span').html('Depósito realizado com sucesso');
                                            $('#boxPago').css('opacity', 1).show();
                                            var audio = new Audio('audio/song.mp4');
                                            audio.play();
                                            setTimeout(function () {
                                                $('#boxPago').css('opacity', 0).hide();
                                            }, 3000);
                                        }
                                        if (parseInt(forma_pagamento.SALVAR_CC) && parseInt(forma_pagamento.CC))
                                            CC.add(cardData, bandeira);
                                    }
                                },
                                function () {
                                    $('.btnConfirme').attr('disabled', false);
                                }
                            );
                            break;
                        case 'compra':
                            var compra = function (CPF_NA_NFE) {
                                Factory.ajax(
                                    {
                                        action: 'payment/confirm',
                                        data: {
                                            UTILIZADO_SALDO: $rootScope.ACTIVE_SALDO,
                                            VOUCHER: $rootScope.VOUCHER || 0,
                                            CPF_NA_NFE: CPF_NA_NFE,
                                            FORMA_PAGAMENTO: forma_pagamento,
                                            TRANSACAO_ID: $rootScope.transacaoId,
                                            EXTRA: extra
                                        }
                                    },
                                    function (data) {
                                        $('.btnConfirme').attr('disabled', false);

                                        switch (parseInt(data.status)) {
                                            case 1:
                                                $rootScope.verify();

                                                /*
                                                 * Salvar cartao
                                                 */
                                                if (parseInt(forma_pagamento.SALVAR_CC) && parseInt(forma_pagamento.CC))
                                                    CC.add(cardData, bandeira);
                                                break;
                                            case 2:

                                                break;
                                            default:
                                                Payment.cancel();
                                                break;
                                        }
                                    },
                                    function () {
                                        $('.btnConfirme').attr('disabled', false);
                                    }
                                );
                            };
                            try {
                                navigator.notification.confirm(
                                    '',
                                    function (buttonIndex) {
                                        if (buttonIndex == (Factory.$rootScope.device == 'ios' ? 2 : 1))
                                            compra(1);
                                        else
                                            compra(0);
                                    },
                                    'CPF na nota fiscal?',
                                    Factory.$rootScope.device == 'ios' ? 'Não,Sim' : 'Sim,Não'
                                );
                            } catch (e) {
                                if (confirm('CPF na nota fiscal?'))
                                    compra(1);
                                else {
                                    compra(0);
                                }
                            }
                            break;
                    }
                };
                var msg = 'Tem certeza que deseja realizar ' + (origem == 'saldo' ? 'a compra de saldo de R$ ' + $rootScope.VALOR_PG + ' para sua carteira' : 'esta compra') + '?';
                try {
                    navigator.notification.confirm(
                        '',
                        function (buttonIndex) {
                            if (buttonIndex == (Factory.$rootScope.device == 'ios' ? 2 : 1))
                                submitPayment();
                            else {
                                $('.btnConfirme').attr('disabled', false);
                                $('#carregando').hide().css('opacity', 0);
                            }
                        },
                        msg,
                        Factory.$rootScope.device == 'ios' ? 'Não,Sim' : 'Sim,Não'
                    );
                } catch (e) {
                    if (confirm(msg))
                        submitPayment();
                    else {
                        $('.btnConfirme').attr('disabled', false);
                        $('#carregando').hide().css('opacity', 0);
                    }
                }
            }, 100);
        };
        $rootScope.confirmPayment = function (origem) {
            $('#carregando').css('display', 'flex').css('opacity', 1);
            $('.btnConfirme').attr('disabled', true);
            var valido = false;
            if ($rootScope.FORMA_PAGAMENTO && $('#boxPg > ul > li.active').length) {
                $.each($rootScope.FORMAS_PG, function (idx, item_each) {
                    if (parseInt(item_each.ACTIVE))
                        $rootScope.FORMA_PAGAMENTO = item_each;
                });
                if (parseInt($rootScope.FORMA_PAGAMENTO.CC)) {
                    if ($rootScope.CARD) {
                        switch ($rootScope.FORMA_PAGAMENTO.TIPO) {
                            case 'JCC':
                                var card_juno = CC.decrypt($rootScope.CARD[1]);
                                $rootScope.FORMA_PAGAMENTO.cardNumber = card_juno.cardNumber;
                                $rootScope.FORMA_PAGAMENTO.expirationMonthYear = card_juno.expirationMonth + '/' + card_juno.expirationYear;
                                $rootScope.FORMA_PAGAMENTO.cvv = card_juno.securityCode;
                                $rootScope.FORMA_PAGAMENTO.cardName = card_juno.holderName;
                                break;
                            default:
                                $rootScope.FORMA_PAGAMENTO.cardNumber = $rootScope.CARD[1];
                                $rootScope.FORMA_PAGAMENTO.expirationMonthYear = $rootScope.CARD[2];
                                $rootScope.FORMA_PAGAMENTO.cvv = $rootScope.CARD[3];
                                $rootScope.FORMA_PAGAMENTO.cardName = $rootScope.CARD[5];
                                break;
                        }
                        valido = true;
                    } else {
                        $rootScope.FORMA_PAGAMENTO.CC_BANDEIRA = $('#cardBandeira').val();
                        $rootScope.FORMA_PAGAMENTO.cvv = $('#cvv:visible').val();
                        if (!$rootScope.FORMA_PAGAMENTO.cardName)
                            $('#cardName:visible').focus();
                        else if (!$rootScope.FORMA_PAGAMENTO.cardNumber)
                            $('#cardNumber:visible').focus();
                        else if (!$rootScope.FORMA_PAGAMENTO.expirationMonthYear)
                            $('#expirationMonthYear:visible').focus();
                        else if (!$rootScope.FORMA_PAGAMENTO.cvv)
                            $('#cvv:visible').focus();
                        else
                            valido = true;
                    }
                } else
                    valido = true;
            } else if ($rootScope.VALOR_PG)
                Factory.alert('Selecione um meio de pagamento!');
            else {
                $rootScope.FORMA_PAGAMENTO = null;
                valido = true;
            }

            if (valido) {
                if ($rootScope.FORMA_PAGAMENTO) {
                    if ($('#cvv:visible').val())
                        $rootScope.FORMA_PAGAMENTO.cvv = $('#cvv:visible').val();
                    switch ($rootScope.FORMA_PAGAMENTO.GATEWAY) {
                        case 'PAGSEGURO':
                            if ($rootScope.PAGSEGURO_SESSIONID)
                                $rootScope.paymentPagSeguro(origem);
                            else
                                $rootScope.pagseguro(1, origem);
                            break;
                        case 'JUNO':
                            $rootScope.paymentJuno(origem);
                            break;
                        default:
                            $rootScope.processPayment(origem);
                            break;
                    }
                } else
                    $rootScope.processPayment(origem);
            } else {
                $('#carregando').hide().css('opacity', 0);
                $('.btnConfirme').attr('disabled', false);
            }
        };
        $rootScope.STEPS = [];
        $rootScope.transacaoIdCarrinho = false;
        $rootScope.transacaoId = 0;
        $scope.selectCard = function (ITENS, V) {
            if (!V.ACTIVE) {
                $rootScope.FORMA_PAGAMENTO.cardNumber = '';
                $rootScope.FORMA_PAGAMENTO.cardName = '';
                $rootScope.FORMA_PAGAMENTO.expirationMonthYear = '';
                $rootScope.FORMA_PAGAMENTO.cvv = '';
            }
            $.each(ITENS, function (idx, item_each) {
                item_each.ACTIVE = 0;
            });
            V.ACTIVE = 1;
            $rootScope.CARD = V.ID ? V.VALS : null;
        };

        $rootScope.clickEscanear = function (type) {
            $rootScope.BTN_HOME = false;
            $rootScope.transacaoId = 0;
            $rootScope.transacaoIdCarrinho = false;
            BarCodeScanner.scan(type);
        };
    });

    app.controller('SemInternet', function ($rootScope, $scope, $routeParams) {
        $rootScope.border_top = 1;
        $rootScope.Titulo = "Ops...";
    });

    app.controller('Command', function ($rootScope, $scope, $routeParams, ReturnData) {
        $rootScope.border_top = 1;
        $scope.PARAMS = $routeParams;
        $rootScope.REDIRECT = '';
        $rootScope.MenuBottom = 1;

        $scope.TEXTO_BLUETOOTH = 'Conectando com o dispositivo...';
        bluetooth.tentativas = 0;
        $rootScope.Bluetooth = function () {
            setTimeout(function () {
                $scope.$apply(function () {
                    $scope.REG = {'TEXTO': $scope.TEXTO_BLUETOOTH};
                    $scope.IMG = 1;
                });
            }, 1);
            if (bluetooth.tentativas == 1)
                bluetooth.detravar();
            clearInterval(bluetooth.timeout);
            bluetooth.timeout = setInterval(function () {
                if (!bluetooth.deviceId) {
                    bluetooth.tentativas++;
                    if (!(bluetooth.tentativas == 0 || bluetooth.tentativas == 1) && bluetooth.tentativas < 7)
                        bluetooth.detravar();
                    $scope.$apply(function () {
                        $scope.IMG = bluetooth.tentativas == 7 ? 0 : 1;
                        if (bluetooth.tentativas == 7) {
                            $scope.REG = {'TEXTO': 'Nenhum dispositivo encontrado.<br><br><br><a style="text-decoration: underline" onclick="Factory.$rootScope.Bluetooth()">Tentar novamente</a>'};
                            bluetooth.tentativas = 1;
                            clearInterval(bluetooth.timeout);
                        }
                    });
                }
            }, 3000);
        };

        switch ($routeParams.TYPE) {
            case '18+':
                switch ($routeParams.SET) {
                    case 'BEB_ALC':
                    case 'BEB_ALC1':
                    case 'BEB_ALC2':
                    case 'BEB_ALC3':
                    case 'BEB_ALC4':
                        clearInterval(bluetooth.timeout);
                        switch ($routeParams.SET) {
                            case 'BEB_ALC':
                            case 'BEB_ALC1':
                                $rootScope.Titulo = 'BEBIDAS ALCOÓLICAS';
                                break;
                            case 'BEB_ALC2':
                                $rootScope.Titulo = 'BEBIDAS NÃO ALCOÓLICAS';
                                break;
                            case 'BEB_ALC3':
                                $rootScope.Titulo = 'REFRIGERADOS';
                                break;
                            case 'BEB_ALC4':
                                $rootScope.Titulo = 'ADEGA';
                                break;
                        }
                        $scope.REG = {
                            'TIME': parseInt(Login.getData().TIME_TRAVA),
                            'TEXTO': '<i class="mdi mdi-action-lock-open"></i> Portas destravadas<span>Fechando em...</span>'
                        };
                        var seTime = $scope.REG.TIME;
                        $scope.TIME = '00:' + (seTime < 10 ? '0' : '') + seTime;
                        $scope.PERCENTUAL = Math.ceil(100 / seTime);
                        var time = seTime;
                        var percentual = 0;
                        var timeoutTime = setInterval(function () {
                            time--;
                            percentual += 100 / seTime;
                            if (time <= 0 || percentual >= 100)
                                percentual = 100;
                            $scope.$apply(function () {
                                $scope.TIME = '00:' + (time < 10 ? '0' : '') + time;
                                $scope.PERCENTUAL = Math.ceil(percentual);
                                if (percentual == 100) {
                                    $scope.REG.TEXTO = 'Portas travadas';
                                    clearInterval(timeoutTime);
                                }
                            });
                        }, seTime ? 1000 : 0);
                        break;
                    case 'BLUETOOTH':
                        $rootScope.Titulo = '<i class="mdi mdi-action-settings-bluetooth"></i> BLUETOOTH';
                        $rootScope.Bluetooth();
                        break;
                }
                break;
            default:
                $scope.REG = ReturnData;
                $rootScope.Titulo = ReturnData.TITULO;
                break;
        }
    });

    app.controller('AreaRestrita', function ($rootScope, $scope, $routeParams) {
        $rootScope.BARRA_SALDO = false;
        $rootScope.border_top = 1;
        $rootScope.NO_WHATSAPP = false;
        $rootScope.Titulo = "Área restrita";
    });

    app.controller('Faq', function ($rootScope, $scope, $routeParams, ReturnData) {
        $rootScope.border_top = 1;
        $rootScope.Titulo = "FAQ";
        $scope.CONTENT = ReturnData.CONTENT;
        $scope.LST = ReturnData.LST;
        $rootScope.REDIRECT = '';
    });

    app.controller('Token', function ($rootScope) {
        $rootScope.border_top = 1;
        $rootScope.Titulo = "Token";
        $rootScope.REDIRECT = '';
    });

    app.controller('Suporte', function ($rootScope) {
        $rootScope.border_top = 1;
        $rootScope.Titulo = "Suporte";
        $rootScope.REDIRECT = '';
        $rootScope.NO_WHATSAPP = false;
    });

    app.controller('AtualizarApp', function ($rootScope, $scope, ReturnData) {
        $rootScope.BARRA_SALDO = false;
        $rootScope.NO_WHATSAPP = false;
        $rootScope.Titulo = "Nova versão";
        $rootScope.REDIRECT = '';
        $scope.REG = ReturnData;
    });

    app.directive('onErrorSrc', function () {
        return {
            link: function (scope, element, attrs) {
                element.bind('error', function () {
                    attrs.$set('src', 'img/login_default.png');
                });
            }
        }
    });

    var TimeOutScroll = null;
    app.directive('scroll', function ($routeParams) {
        return {
            link: function (scope, element, attrs) {
                angular.element(element).bind("scroll", function () {
                    var _this = $(this);
                    if (_this.attr('type') == 'produtos' && !$('.boxPopup:visible').length) {
                        var scrollTop = parseFloat(_this.scrollTop());
                        if (scrollTop > 50) {
                            clearTimeout(TimeOutScroll);
                            TimeOutScroll = setTimeout(function () {
                                var getScrollValue = parseFloat(_this.attr('scroll-value'));
                                $('body').attr('scroll', getScrollValue > scrollTop ? 0 : 1);
                                _this.attr('scroll-value', scrollTop);
                            }, 100);
                        }else
                            $('body').attr('scroll', 0);
                    }
                    if (parseInt(_this.attr('scroll')) && Factory.$rootScope.scrollLiberado) {
                        if ((_this.find('> ul').height() - _this.height() - _this.scrollTop()) <= 400) {
                            Factory.$rootScope.scrollLiberado = false;
                            switch (_this.attr('type')) {
                                case 'produtos':
                                case 'produtos_categorias_busca':
                                    Factory.$rootScope.scroll(_this.attr('type'));
                                    break;
                            }
                        }
                    }
                });
            }
        };
    });

    app.directive('selectSearch', function () {
        return {
            restrict: 'A',
            controllerAs: '$selectSearch',
            bindToController: {},
            controller: selectSearchController
        };
    });

    app.directive('label', function () {
        return function (scope, element, attrs) {
            element.bind("click", function (event) {
                if ($(this).attr('for'))
                    $(this).find('input').focus();
            });
        };
    });

    var timeoutBlurInput = null;
    app.directive('input', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    $(this).blur();
                    $(this).closest('form').find('.btn-salvar[type="submit"]').trigger('click');
                } else if ($(this).attr('id') == 'postalcode' || $(this).attr('id') == 'cpf' || $(this).attr('id') == 'senha')
                    inputEvents(this, 'key');
            });
            element.bind("blur", function (event) {
                timeoutBlurInput = setTimeout(function () {
                    $('.scrollable-content').css('padding-bottom', 0);
                }, 2000);
                inputEvents(this, 'blur');
            });
            element.bind("focus", function (event) {
                if (Factory.$rootScope.device == 'ios') {
                    clearTimeout(timeoutBlurInput);
                    var position = $('.scrollable-content').position();
                    if (position) $('.scrollable-content').css('padding-bottom', position.top + 320);
                }
            });
        };
    });

    app.directive('select', function () {
        return function (scope, element, attrs) {
            element.bind("blur", function (event) {
                $('.scrollable-content').css('padding-bottom', 0);
            });
            element.bind("focus", function (event) {
                if (Factory.$rootScope.device == 'ios') {
                    clearTimeout(timeoutBlurInput);
                    var position = $('.scrollable-content').position();
                    if (position) $('.scrollable-content').css('padding-bottom', position.top + 320);
                }
            });
        };
    });
}catch (e) {
    location.reload();
}


app.controller('SacLst', function($rootScope, $scope, ReturnData)  {
    $rootScope.border_top = 1;
    $rootScope.Titulo = "Posso ajudar?";
    $rootScope.REDIRECT = '';
    $rootScope.NO_WHATSAPP = false;
    $scope.ABERTOS = ReturnData.ABERTOS;
    $scope.FECHADOS = ReturnData.FECHADOS;
    $scope.PONTUACAO_TEMP = '0';
    $scope.LOGIN = ReturnData.Login;

    /*
    * Função responsável por transicionar as abas "abertos" e "fechados" da listagem de sac
    * @params element(DOM) -> aba a ser transicionada como referência para construir as animações.
    *
    * */
    $scope.TransitionAbas =  function(element)  {
        var label = $(element).parent().find('.borderAba');

        if(!$(label).hasClass('active')){
            var active =$('.active');
            var animateA = $(label).hasClass('fechados') ? {left: '100%'} : {right: '100%'};

            $(active).animate(animateA,200, ()=>{
                document.querySelectorAll('.borderAba').forEach((item) =>{
                    $(item).removeClass('active');
                });

                let arruma = ($(label).hasClass('fechados') ? {'right': 0} : {'left': 0});

                $(label).addClass('active').css(arruma);
                $('#fechados').css({'display':($(label).hasClass('fechados') ? 'block' : 'none')});
                $('#abertos').css({'display':($(label).hasClass('fechados') ? 'none' : 'block')});
            });

        }
    };

    /*
    * Passagem da @function TransitionAbas para o $rootScope, o que permite ela ser usada fora da controller SacLst
    * @params element(DOM) -> aba a ser transicionada como referência para construir as animações.
    *
    * */
    $rootScope.TransitionAbas = function(element){$scope.TransitionAbas(element);};

    /*
    * Função responsável para renderizar o chat selecionado.
    * @params id(Integer) -> valor do id do chat desejado.
    *
    * */
    $scope.openChat = function(id){
        $rootScope.location('#!/sac/' + id);
    };

    /*
    * Função responsável por abrir o form de novo sac.
    *
    * */
    $scope.OpenNewSac = function() {
        $('#newSac').addClass('opened_sacnew').css({'display':'block', 'left':'100%'}).animate({left: 0}, 500);
    };

    /*
    * Função responsável por fechar form de novo sac.
    *
    * */
    $scope.CloseNewSac = function(){
        $('#newSac').removeClass('opened_sacnew').css('display', 'none').animate({left:'100%'}, 1000);
    };

    /*
    * Funçao responsável por salvar um sac novo.
    *
    * */
    $scope.saveSac = function(){
        let validator = true;
        /* validação de campos do formulário de sac
        * Aqui é transformado a collection da classe ".required" em array para poder verificar o valor de cada item.
        * */
        Array.from($('.required')).forEach(item => {
            if($(item).val() == '') {
                $(item).css('border', '1px solid #ff0000');
                $('#errornewSac').css('display','block');
                validator = false;
            };
        });
        if(!validator) return false;
        Factory.ajax(
            {
                action: 'sac/savesac',
                data: $('#fromnew').serializeArray()
            },
            (data)=> {
                $rootScope.location(`#!/sac/${data.ID}`);
            });
    };

    /*
    * Função responsável por preencher com cor as estrelas de ranking de acordo com o clique do usuário.
    * @params element(DOM) -> estrela clicada.
    *
    * */
    $scope.setRanking = function(element){
        let point = parseInt($(element).data('value'));
        $scope.PONTUACAO_TEMP = $(element).data('value').toString();

        document.querySelectorAll('.setRanking').forEach(item =>{
            $(item).removeClass('pointed').css('color','#fff');
            if(parseInt($(item).data('value')) <= point) $(item).addClass('pointed').css('color','#93b83e');
        });
    }

    /*
    * Função responsável por abrir o form de análise do sac
    * @params button(DOM) -> botão que recebe o evento de clique, também serve como referência para pegar as informações necessárias
    *
    * */
    $scope.openChamadoAnalise = function(button){
        let h4 = $(button).parent().parent().find('.fechado_chamado_header');
        let analiseForm = $(button).parent().parent().find('.area_ranking');
        let chamado = $(button).parent().parent();

        $(chamado).css('height', '6em');

        $(button).css('opacity',1).animate({opacity:0}, 500, ()=>{
            $(button).parent().css('display','none');
            $(analiseForm).css({'bottom':'-100%', 'display': 'block'}).animate({bottom: 0}, 500);
            $(chamado).animate({height: '60vh'}, 500);
            $(h4).animate({width: '100%'}, 500);
        });

    }

    /*
    * Função responsável por fechar o form de analise do sac
    * @params button(DOM) -> botão que recebe o evento de clique, também serve como referência para pegar as informações necessarias
    *
    * */
    $scope.closeChamadoAnalise = function(button){
        let analiseForm = $(button).parent().parent();
        let chamado = $(button).parent().parent().parent();
        let h4 = $(chamado).find('.fechado_chamado_header');
        $(analiseForm).animate({bottom:'-100%'}, 500);

        $(chamado).animate({height:'6em'}, 500, ()=>{
            $(analiseForm).css('display','none');
            $(chamado).find('.buttonsRanking').css('display','flex');
            $(chamado).find('.buttonsRanking button').animate({opacity:'1'}, 500);
            $(h4).animate({width: ($(chamado).find('.chamado_title').width() + 1) + 'px'}, 500);
        });
    };

    /*
    * Função responsável por salvar a analise do sac.
    * @params button(DOM) -> botão que recebe o evento de clique, também serve como referência para pegar as informações necessarias
    *
    * */
    $scope.saveAnalise = function(button){
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
            $(showStatus).css({'color':'#ff0000','font-size': '12px', 'margin-top':'2em'}).html('Por favor avalie este chamado');
            $(showStatus).css('display','block');
            setTimeout(()=>{
                $(showStatus).css('display','none');
            },1000)
        }
    }

    /*
    * Função responsável por mostrar texto referente a pontuação do chamado.
    * @params points(String) -> pontuação do sac
    * @return Object -> retorna um objeto com texto e cor a ser mostrado.
    * */
    $scope.showTypeAnalise = function(points) {
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



app.controller('ChatLst', ['$rootScope', '$scope', '$http', 'ReturnData', function ($rootScope, $scope, $http, ReturnData) {

    $rootScope.border_top = 1;
    $rootScope.Titulo = ReturnData.CHAT.TITULO;
    $rootScope.REDIRECT = '';
    $rootScope.NO_WHATSAPP = false;
    $scope.ITENS = ReturnData.CHAT_ITENS;
    $scope.CONVERSATION = '';
    $scope.IMAGE_UPLOADER = '';
    $scope.RESPOSTA = {id: null, text:null, image:null};
    $scope.CLIENTE = ReturnData.Login;

    /*
    * Função responsável por mandar o usuário para a última mensagem enviada assim que entra na tela da conversa
    *
    * */
    $scope.initScroll = () => {
        setTimeout(()=>{
            $('#panelConversa').scrollTop($('#panelConversa').prop("scrollHeight"))
        },1000)
    };

    /*
    * Função responsável por iniciar o listner do banco e monitorar caso existam novas mensagens para renderizar na tela
    *
    * */
    $scope.init =  () => {

        setTimeout( () => {
            if($('#panelConversa').length) {
                let lastID = $scope.ITENS[$scope.ITENS.length - 1].ID;
                // Promise para retornar o status do chat, para monitorar se o chat foi finalizado.
                let statusChat = new Promise((resolve, reject) => {
                    Factory.ajax(
                        {
                            action: 'sac/getconversarion',
                            data: {
                                SAC: ReturnData.CHAT.ID,
                                ID: lastID
                            }
                        },
                        (data) => {
                            if (data.CHAT_ITENS.length > 0) {
                                data.CHAT_ITENS.forEach((item) => {
                                    $scope.ITENS.push(item);
                                });

                                $('#panelConversa').animate({ scrollTop: $('#panelConversa').prop("scrollHeight")}, 1000);
                            }
                            resolve(data.CHAT.STATUS);
                        }
                    );
                }).then(status =>{
                    return status;
                })
                statusChat.then(status =>{
                    if(status != 'F') {
                        $scope.init();
                    }else{
                        $('#finalizadoChat').css('display', 'flex').animate({opacity: 1}, 200);
                    }

                })
            }
        },2000);
    };

    /*
    * Função responsável pelo envio da mensagem
    *
    * */
    $scope.sendMessage = function() {
        if((this.ChatLst && this.ChatLst.CONVERSATION !="") || $scope.IMAGE_UPLOADER !=""){

            let text = this.ChatLst ? this.ChatLst.CONVERSATION : null;
            let anexos = $scope.IMAGE_UPLOADER != "" ? $scope.IMAGE_UPLOADER : null;
            //   loading(1);
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
                (data) => {
                    var image = $scope.imageToBase64(anexos); // Função com promise para transformar a imagem em base 64 e só então faz o envio da mensagem.
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
                            RESPOSTA_ANEXO: $scope.RESPOSTA.image || null,
                            RESPOSTA_MENSAGEM: data.DADOS_ENVIADOS.RESPOSTA_MENSAGEM || null
                        });
                        $scope.removeImage();
                        $scope.RESPOSTA = {id: null, text:null, image:null};
                        $('.removeMessageResponse').click();
                        $(this).parent().remove();

                        setTimeout(()=>{
                            $('#panelConversa').animate({ scrollTop: $('#panelConversa').prop("scrollHeight")}, 500 );
                            //  loading(0);
                        },800);


                    });


                }
            );
            if (this.ChatLst)
                this.ChatLst.CONVERSATION = '';
        }

    };

    /*
    * Função responsável por tratar a renderização da imagem na tela no momento que usuário seleciona uma.
    * @params element(File) -> elemento do tipo file no qual a partir dele é retirado a imagem selecionada.
    * */
    $scope.uploadFile = function (element) {
        $scope.IMAGE_UPLOADER = element.files[0];
        var reader = new FileReader();
        reader.readAsDataURL(element.files[0]);
        reader.onload = () => {
            /*  ----- valores para o ajuste do elemento pai da parte inferior que controlar o background durante as animações ------ */
            let resizeANDROID = $scope.RESPOSTA.id ? '25vh' : 'auto';
            let resizeIOS = $scope.RESPOSTA.id ? '26vh' : '13vh';
            /* ----------------- fim --------------------------------------------- */

            let bottomResize = Factory.$rootScope.device == 'ios' ? '16vh': '14vh'; // ajuste de distância do fim da tela e do elemento pai da imagem.
            let panelResize = Factory.$rootScope.device == 'ios' ? '72vh': '76vh'; // ajuste do tamanho do elemento pai dos balões de conversa

            var blockImage = '<div class="image_content">';
            blockImage += '<img src="' + reader.result + '" />';
            blockImage += '<span class="mdi-navigation-close removeImage" data-id="' + $scope.IMAGE_UPLOADER.length + '" onclick="angular.element(this).scope().removeImage(this)" ></span>';
            blockImage += '</div>';
            $('#showImage').css('width', '100vw');
            // $('#showImage').css('margin-top', '1%');
            $('#showImage').html(blockImage);
            $('#panelInput').css('height', Factory.$rootScope.device == 'ios' ? resizeIOS : resizeANDROID);
            $('#panelConversa').css('max-height',panelResize);
            $('#showImage').css('bottom', $scope.RESPOSTA.id ? bottomResize : '8vh');
        };
        reader.onerror = (error) => {
            console.log('Error: ', error);
        };
    };

    /*
    * Função responsável por remover o elemento da imagem da tela e tambem limpar tanto a variável responsável por carregar esse valor e o input file.
    *
    * */
    $scope.removeImage =  function() {
        $scope.IMAGE_UPLOADER = '';

        /* valores para o ajuste do elemento pai da conversa onde mostram os balões */

        let valueHeightANDROID = $scope.RESPOSTA.id ? '82vh':'88vh';
        let valueHeightIOS = $scope.RESPOSTA.id ? '75vh':'80vh';

        /* ----------------------- fim -------------------------------------  */

        /*   valores para o ajuste do elemento pai da parte inferior que controlar o background durante as animações   */

        let inputIOS = {'height':$scope.RESPOSTA.id ? '14vh': '9vh', 'bottom':'0'};
        let inputANDROID = {'height':$scope.RESPOSTA.id ? '14vh': '9vh', 'bottom':'0'};

        /* -----------------------------fim------------------------------------------- */

        $('#showImage').empty();
        $('#showImage').css('margin', '0');
        $('#showImage').css('width', '0');
        $('#panelInput').css(Factory.$rootScope.device == 'ios' ? inputIOS : inputANDROID);
        $('#fileManager').val('');


        $('#panelConversa').animate({maxHeight: Factory.$rootScope.device == 'ios' ? valueHeightIOS : valueHeightANDROID  },{duration: 500});
    };

    /*
    * Função assíncrona responsável por transformar a imagem em base64, e assim podermos renderizar ela na tela antes de ser enviada ao servidor S3 e ser salva
    * OBS.: Como esta função é assíncrona, sempre tratar ele com uma Promise, para garantir que não cause nenhum tipo de problema.
    * @params image(File) -> imagem que vai ser convertida em base64
    *
    * */
    $scope.imageToBase64 = async function(image) {
        var reader = new FileReader();
        if(image == null) return null;
        reader.readAsDataURL(image);
        return new Promise((resolve, reject) => {
            reader.onload = () => {
                $('#fileManager').val('');
                resolve(reader.result);
            };
            reader.onerror = (error) => {
                reject(error);
            };
        });
    };

    /*
    * Função responsável por abrir a opção de responder nos balões de conversa.
    * @params element(DOM) -> elemento que recebe o clique para abrir o box
    *
    * */
    $scope.openResposeBox = function(element) {

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

    /*
    * Função responsável por montar o elemento da resposta com o conteúdo da mensagem selecionada.
    * @params element(DOM) -> elemento de referência para a partir dele achar os conteúdos necessários.
    *
    * */
    $scope.startResponse = function(element){
        // promise para começar a montagem do elemento de resposta apenas quando remover o atual(caso tenha um).
        var deleteAndMount = new Promise((resolve, reject) => {
            resolve($("#panelInput").find(".responseMessage").remove())
        }).then(item => {
            return true
        });
        deleteAndMount
            .then(item =>{
                let setVariables = new Promise((resolve, reject) => {
                    $scope.RESPOSTA.image = null;
                    $('.responsearrow').removeClass('activeR')
                    $('.panel_choice').css('display','none')
                    let subtext = '';
                    let text = $scope.RESPOSTA.text = $(element).parent().parent().find('.content_description_baloon').html();

                    /* valores para o ajuste do elemento pai da parte inferior que controlar o background durante as animações */

                    let resizeANDROID = {'height': ($scope.IMAGE_UPLOADER ? '25vh' : '15vh')};
                    let resizeIOS = {'height':($scope.IMAGE_UPLOADER ? '26vh' : '14vh'), 'bottom':'0'};

                    /* -----------------------------------------------------fim----------------------------- */

                    let image =  $(element).parent().parent().find('.content_img_baloon').html();

                    let idBaloon = $scope.RESPOSTA.id = $(element).parent().parent().data('id');
                    if(image != undefined) $scope.RESPOSTA.image = image.split('"')[1];
                    if($scope.IMAGE_UPLOADER)$('#showImage').css('bottom','16vh');
                    if(!text && image != undefined) subtext = 'Imagem';

                    setTimeout(()=>{
                        /* todas as variáveis criadas e tratadas dentro da promise são passadas pelo resolve para ser pega em qualquer outro momento dentro da função geral  */
                        resolve({text:text, subtext:subtext, resize:Factory.$rootScope.device == 'ios' ? resizeIOS : resizeANDROID , image:image, idBaloon:idBaloon})
                    }, 200)

                }).then(item =>{
                    return item;
                })
                setVariables.then(item=>{
                    let html ='<div class="responseMessage">';
                    html += '<i class="mdi-navigation-close removeMessageResponse" ></i>';
                    html += '<span data-id="' + item.idBaloon +'">' +( item.text || item.subtext) +' ' + (item.image || "") + '</span>';
                    html += '</div>';
                    $('#rest').css('margin-top','0');
                    $("#showImage").after(html);

                    $('.responseMessage').css('bottom', '-60px')

                    $('.responseMessage').css('z-index', '1');
                    $('.responseMessage').animate({bottom: '51px'},500, ()=>{

                        $('#panelInput').css(item.resize);
                        $('#panelConversa').animate({maxHeight: Factory.$rootScope.device == 'ios' ? '75vh' :'82vh'},{duration: 500});
                        $scope.removehtmlResponse();
                    });
                })
            });
    }

    /*
    * Função responsável por remover o box da resposta selecionada.
    *
    * */
    $scope.removehtmlResponse = function() {
        $('.removeMessageResponse').click((evt) =>{
            $scope.RESPOSTA = {id: null, text:null, image:null};

            /* valores para o ajuste do elemento pai da conversa onde mostram os balões */

            let valueHeightANDROID = $scope.IMAGE_UPLOADER ?'76vh': '88vh';
            let valueHeightIOS = $scope.IMAGE_UPLOADER ?'72vh': '80vh';

            /* -------------------------fim-------------------------------- */

            /* valores para o ajuste do elemento pai da parte inferior que controlar o background durante as animações */

            let inputIOS = {'height': ($scope.IMAGE_UPLOADER ?  '13vh' : '9vh'), 'bottom': '0'};
            let inputANDROID = {'height': $scope.IMAGE_UPLOADER ? '14vh' : '9vh'};

            /* ----------------fim----------------------------------------------------------------------- */

            evt.preventDefault();
            $('.responseMessage').animate({opacity: '0'},{duration: 500})
            setTimeout(()=>{
                $(this).parent().remove();

                $('#panelInput').css(Factory.$rootScope.device == 'ios' ? inputIOS :inputANDROID);

                $('#panelConversa').animate({maxHeight: Factory.$rootScope.device == 'ios' ? valueHeightIOS :valueHeightANDROID},{duration: 500});
                if($scope.IMAGE_UPLOADER)$('#showImage').css('bottom','8vh');
            },500)
        })
    }
    /*
    * Função responsável por fazer a conversa deslizar até a resposta clicada quando a mesma é responsável em algum outro momento da conversa.
    * @params id(Integer) -> id da mensagem que vai ser o foco do scroll.
    *
    * */
    $scope.FindMessage = function(id){

        // Promise para fazer a animação de deslizar até o elemento certo e só então fazer as animações no elemento.
        if(Factory.$rootScope.device == 'android'){
            let upAnimation = new Promise((resolve, reject) => {
                document.querySelector('.findin_' + id).scrollIntoView({block:"center", behavior:"smooth"})
                setTimeout(()=>{
                    resolve(true);
                }, 500)

            }).then(item=>{
                return true;
            })
            upAnimation.then(item =>{
                $('.findin_' + id).animate({opacity:'0.2'}, 400, ()=>{
                    $('.findin_' + id).animate({opacity:'1'}, 400)
                });
            })
        }else{
            $('#panelConversa').animate({scrollTop: $('.findin_' + id).offset().top}, 1000,() =>{
                $('.findin_' + id).animate({opacity:'0.2'}, 400, ()=>{
                    $('.findin_' + id).animate({opacity:'1'}, 400)
                });
            })
        }



    }

    /*
    * Função responsável por voltar a tela para a tela de listagem do SAC
    * OBS.: essa função só é usada quando o sac é finalizado e o usuário ainda está na tela da conversa.
    *
    * */
    $scope.backtosac = function(){
        $rootScope.location('#!/sac/');
    }

    $(document).ready(()=>{

        /* nosso momento são separados eventos específicos para ANDROID e IOS */

        if(Factory.$rootScope.device == 'android'){


            $('#reponser').live('focus',(e)=>{
                if($scope.RESPOSTA.id) $('#panelInput').css({'height': $scope.IMAGE_UPLOADER ? '35vh' : '25vh'});
                if($scope.IMAGE_UPLOADER) $('#showImage').css('bottom', $scope.RESPOSTA.id ? '22vh' : '8vh');
            });
            $('#reponser').live('blur',(e)=>{
                $('#panelInput').css({'height':$scope.RESPOSTA.id || $scope.IMAGE_UPLOADER ? '14vh' :'9vh'});
            });
        }

        if(Factory.$rootScope.device == 'ios'){

            /*
            * Evento para escutar quando o teclado vai subir, e com isso tratar os elementos que precisam ser alterados.
            * OBS.: Esses eventos são apenas suportados por dispositivos IOS
            * */
            window.addEventListener('keyboardDidShow',  () => {
                let Cpnversapanel = $scope.IMAGE_UPLOADER ? {'maxHeight': $scope.RESPOSTA.id ? '44vh' : '51vh', 'height': $scope.RESPOSTA.id ? '44vh' : '51vh'} : {'maxHeight':'52vh', 'height':'52vh'}
                $('#rest').animate({'bottom':'30vh'},300);
                $('#panelConversa').animate(Cpnversapanel,300);
                // if($scope.RESPOSTA.id) $('#panelInput').css({'height': $scope.IMAGE_UPLOADER ? '35vh' : '20vh'});
                if($scope.RESPOSTA.id) $('.responseMessage').css({'bottom': '34vh'});
                if($scope.IMAGE_UPLOADER) $('#showImage').css('bottom', $scope.RESPOSTA.id ? '40vh' : '35vh');
                if($scope.IMAGE_UPLOADER && $scope.RESPOSTA.id){
                    $('body').css('overflow','hidden');
                }
            });

            /*
            * Evento para escutar quando o teclado vai descer, e com isso tratar os elementos que precisam ser alterados.
            * OBS.: Esses eventos são apenas suportados por dispositivos IOS
            * */
            window.addEventListener('keyboardDidHide',  () => {
                $('#rest').animate({'bottom':'2%'},300);
                $('#panelConversa').animate({'maxHeight':'80vh', 'height':'80vh'},300);
                if($scope.RESPOSTA.id) {
                    $('.responseMessage').css({'bottom': '51px'})
                    $('#panelInput').css({'height': '16vh'})
                };
                if($scope.IMAGE_UPLOADER) {
                    $('#showImage').css('bottom', $scope.RESPOSTA.id ? '22vh' : '9vh');
                    $('#panelInput').css({'height': '19vh'})
                }
            });
        }
    });
}]);

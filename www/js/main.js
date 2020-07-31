try {
    app.controller('Main', function ($rootScope, $scope, $http, $routeParams, $route, $mdSelect, $animate, $sce, deviceDetector) {
        $rootScope.usuario = Login.getData();
        $rootScope.new_iphone = 0;
        $rootScope.QTDE_PUSH = 0;
        Factory.prepare();

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
            fecharCompra();
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
        $rootScope.whatsapp = function () {
            if ($rootScope.usuario.WHATSAPP.ATIVO) {
                Factory.AppBrowser(
                    $rootScope.usuario.WHATSAPP.url + $rootScope.TEXT_WHATSAPP,
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
            $('.scrollable:first').attr('backpage', 1);
            window.history.go(-1);
        };

        $rootScope.clickMenu = function (type) {
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
                case 'destravar':
                    if ($rootScope.TOUR)
                        $rootScope.TOUR = 5;
                    else {
                        if (parseInt(Login.getData().MAIOR_18_ANOS)) {
                            if (Login.getData().DESTRAVAR_AVISO)
                                Factory.alert(Login.getData().DESTRAVAR_AVISO);
                            else
                                bluetooth.detravar(1);
                        } else {
                            Factory.alert('Proibida a venda de bebidas alcoólicas para menores de 18 anos!');
                            $rootScope.location('#!/command/18+/destravar/VENDA_BEBIDA_PROIBIDA', 0, 1);
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
                titulo: 'Suporte',
                controller: 'Suporte',
                url: '#!/suporte',
                icon: 'mdi-communication-live-help',
                logado: 1
            },
            {
                titulo: 'Posso ajudar?',
                controller: 'Sac',
                url: '#!/sac',
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
                        clearInterval(bluetooth.timeout);
                        $rootScope.Titulo = 'BEBIDAS ALCOÓLICAS';
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
                        if (scrollTop > 1) {
                            clearTimeout(TimeOutScroll);
                            TimeOutScroll = setTimeout(function () {
                                var getScrollValue = parseFloat(_this.attr('scroll-value'));
                                $('body').attr('scroll', getScrollValue > scrollTop ? 0 : 1);
                                _this.attr('scroll-value', scrollTop);
                            }, 100);
                        }
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
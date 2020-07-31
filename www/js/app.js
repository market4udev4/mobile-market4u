'use strict';
var app = angular.module(
    'App', [
        'ngRoute',
        'mobile-angular-ui',
        'mobile-angular-ui.gestures',
        'mn',
        'ngAnimate',
        'ngMaterial',
        'ngSanitize',
        'ng.deviceDetector',
        'monospaced.elastic'
    ]
);

app.config(function($routeProvider, $mdThemingProvider, $mdDateLocaleProvider, $httpProvider, $compileProvider, $sceDelegateProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(geo):/);
    $mdThemingProvider.generateThemesOnDemand(true);
    $httpProvider.defaults.withCredentials = true;

    var base = config.url_api[config.ambiente];

    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        base + '**',
    ]);

    /*
     * Route
     */
    $routeProvider
        .when("/", {
            templateUrl: base + "Mobile/www/view/index/index.html",
            controller: 'Index'
        })
        .when("/area-restrita", {
            templateUrl: base + "Mobile/www/view/pages/area-restrita.html",
            controller: 'AreaRestrita'
        })
        .when("/index/:STEP", {
            templateUrl: base + "Mobile/www/view/index/index.html",
            controller: 'Index',
            resolve: {
                ReturnData: function ($route, $rootScope) {
                    switch ($route.current.params.STEP) {
                        case '3':
                        case 'TOUR':
                        case 'LOCAIS':
                            if (!Page.active)
                                $rootScope.location('#!/');
                            break;
                    }
                    return;
                }
            }
        })
        .when("/index/:STEP/:VAL", {
            templateUrl: base + "Mobile/www/view/index/index.html",
            controller: 'Index',
            resolve: {
                ReturnData: function ($route, $rootScope) {
                    switch ($route.current.params.STEP) {
                        case 'CAT':
                        case 'BUSCA':
                        case 'PROD':
                            if (!Page.active)
                                $rootScope.location('#!/');
                            break;
                    }
                    return;
                }
            }
        })
        .when("/conecte-se", {
            templateUrl: base + "Mobile/www/view/conecte-se/conecte-se.html",
            controller: 'ConecteSe',
            resolve: {
                ReturnData: function ($route, $rootScope) {
                    if (parseInt(Login.getData().ID)) {
                        $rootScope.location('#!/');
                        return;
                    } else
                        return Login.get('#!/cadastro');
                }
            }
        })
        .when("/cadastro", {
            templateUrl: base + "Mobile/www/view/conecte-se/form.html",
            controller: 'Cadastro',
            resolve: {
                ReturnData: function ($route, $rootScope) {
                    return parseInt($rootScope.usuario.ID) || !$rootScope.usuario.NOVO ? Login.get() : null;
                }
            }
        })
        .when("/boas-vindas", {
            templateUrl: base + "Mobile/www/view/conecte-se/boas-vindas.html",
            controller: 'BoasVindas',
            resolve: {
                ReturnData: function ($route) {
                    return Factory.ajax(
                        {
                            action: 'cadastro/boasvindas'
                        },
                        function () {
                            Login.get();
                        }
                    );
                }
            }
        })
        .when("/conecte-se-codigo", {
            templateUrl: base + "Mobile/www/view/conecte-se/codigo.html",
            controller: 'ConecteSeCodigo'
        })
        .when("/card-new", {
            templateUrl: base + "Mobile/www/view/conecte-se/card-new.html",
            controller: 'CardNew'
        })
        .when("/add-card-new", {
            templateUrl: base + "Mobile/www/view/conecte-se/addcard-new.html",
            controller: 'AddCardNew'
        })
        .when("/minha-carteira", {
            templateUrl: base + "Mobile/www/view/conecte-se/carteira.html",
            controller: 'MinhaCarteira',
            resolve: {
                ReturnData: function ($route) {
                    return Factory.ajax(
                        {
                            action: 'cadastro/minhacarteira'
                        }
                    );
                }
            }
        })
        .when("/voucher", {
            templateUrl: base + "Mobile/www/view/conecte-se/voucher.html",
            controller: 'VoucherLst',
            resolve: {
                ReturnData: function ($route) {
                    return Factory.ajax(
                        {
                            action: 'cadastro/voucher'
                        }
                    );
                }
            }
        })
        .when("/atualizar-app", {
            templateUrl: base + "Mobile/www/view/pages/atualizar-app.html",
            controller: 'AtualizarApp',
            resolve: {
                ReturnData: function ($route) {
                    if (Page.active) {
                        return Factory.ajax(
                            {
                                action: 'options/atualizarapp'
                            }
                        );
                    } else
                        window.history.go(-1);
                }
            }
        })
        .when("/token/:TOKEN", {
            templateUrl: base + "Mobile/www/view/pages/token.html",
            controller: 'Token',
            resolve: {
                ReturnData: function ($route, $rootScope) {
                    return Factory.ajax(
                        {
                            action: 'options/token',
                            data: {
                                TOKEN: $route.current.params.TOKEN
                            }
                        }, function (data) {

                        }
                    );
                }
            }
        })
        .when("/voucher/:ID", {
            templateUrl: base + "Mobile/www/view/conecte-se/voucher-detalhes.html",
            controller: 'VoucherGet',
            resolve: {
                ReturnData: function ($route) {
                    return Factory.ajax(
                        {
                            action: 'cadastro/voucher',
                            data: {
                                ID: $route.current.params.ID
                            }
                        }
                    );
                }
            }
        })
        .when("/historico-transacoes", {
            templateUrl: base + "Mobile/www/view/conecte-se/historico-transacoes.html",
            controller: 'HistoricoTransacoesLst',
            resolve: {
                ReturnData: function ($route) {
                    return Factory.ajax(
                        {
                            action: 'cadastro/historicotransacoes'
                        }
                    );
                }
            }
        })
        .when("/historico-transacoes/:ID", {
            templateUrl: base + "Mobile/www/view/conecte-se/historico-transacoes-detalhes.html",
            controller: 'HistoricoTransacoesGet',
            resolve: {
                ReturnData: function ($route) {
                    return Factory.ajax(
                        {
                            action: 'cadastro/historicotransacoes',
                            data: {
                                ID: $route.current.params.ID
                            }
                        }
                    );
                }
            }
        })
        .when("/notificacoes", {
            templateUrl: base + "Mobile/www/view/conecte-se/notificacoes.html",
            controller: 'NotificacoesLst',
            resolve: {
                ReturnData: function ($route) {
                    return Factory.ajax(
                        {
                            action: 'cadastro/notificacoes'
                        }
                    );
                }
            }
        })
        .when("/notificacoes/:ID", {
            templateUrl: base + "Mobile/www/view/conecte-se/notificacoes-detalhes.html",
            controller: 'NotificacoesGet',
            resolve: {
                ReturnData: function ($route) {
                    return Factory.ajax(
                        {
                            action: 'cadastro/notificacoes',
                            data: {
                                ID: $route.current.params.ID
                            }
                        }
                    );
                }
            }
        })
        .when("/suporte", {
            templateUrl: base + "Mobile/www/view/pages/suporte.html",
            controller: 'Suporte'
        })
        .when("/sac", {
            templateUrl: base + "Mobile/www/view/pages/sac.html",
            controller: 'SacLst',
            resolve: {
                ReturnData: function ($route) {
                    return Factory.ajax(
                        {
                            action: 'sac/getsacs',
                            data:{
                                CLIENTE: parseInt(Login.getData().ID),
                            }
                        }
                    );
                }
            }
        })
        .when("/sac/:ID", {
            templateUrl: base + "Mobile/www/view/pages/chat.html",
            controller: 'ChatLst',
            resolve: {
                ReturnData: function ($route) {
                    return Factory.ajax(
                        {
                            action: 'sac/getchat',
                            data: {
                                ID: $route.current.params.ID
                            }
                        }
                    );
                }
            }
        })
        .when("/faq", {
            templateUrl: base + "Mobile/www/view/pages/faq.html",
            controller: 'Faq',
            resolve: {
                ReturnData: function ($route) {
                    return Factory.ajax(
                        {
                            action: 'options/faq'
                        }
                    );
                }
            }
        })
        .when("/command/:TYPE/:KEY/:SET", {
            templateUrl: base + "Mobile/www/view/pages/command.html",
            controller: 'Command',
            resolve: {
                ReturnData: function ($route) {
                    Factory.$rootScope.MenuBottom = 1;
                    var get = 0;
                    switch ($route.current.params.SET) {
                        case 'BLUETOOTH':
                        case 'VENDA_BEBIDA_PROIBIDA':
                        case 'BEB_ALC':
                            if (!Page.active) {
                                window.history.go(-1);
                                return [];
                            } else {
                                switch ($route.current.params.SET) {
                                    case 'BLUETOOTH':
                                    case 'BEB_ALC':
                                        return {};
                                        break;
                                    default:
                                        get = 1;
                                        break;
                                }
                            }
                            break;
                        default:
                            get = 1;
                            break;
                    }
                    if (get) {
                        return Factory.ajax(
                            {
                                action: 'options/command',
                                data: $route.current.params
                            }
                        );
                    }
                }
            }
        })
        .when("/ajuda", {
            templateUrl: base + "Mobile/www/view/ajuda/index.html",
            controller: 'Ajuda'
        })
        .when("/sem-internet", {
            templateUrl: base + "Mobile/www/view/sem-internet/index.html",
            controller: 'SemInternet'
        });
});
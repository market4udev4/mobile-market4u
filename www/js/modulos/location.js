var Location = {
    onDeviceReady: function () {
        $(document).on("resume", Location.checkState);
        Location.checkState();
    },
    openSettings: function () {
        if (cordova.platformId === "android")
            cordova.plugins.diagnostic.switchToLocationSettings();
        else
            cordova.plugins.diagnostic.switchToSettings();
    },
    msg: 'Favor verifique o GPS do seu dispositivo, pressione ok e ative a localização para que você consiga navegar no meu app e visualizar os produtos :)',
    requestLocationAccuracy: function () {
        cordova.plugins.diagnostic.requestLocationAuthorization(
            function (result) {
                Location.checkState();
            },
            function (result) {
                Location.checkState();
            },
            cordova.plugins.diagnostic.locationAuthorizationMode.WHEN_IN_USE
        );
        cordova.plugins.locationAccuracy.canRequest(
            function (canRequest) {
                if (cordova.platformId != "android")
                    alert(Location.msg);
                Location.getStatus();
                setTimeout(function () {
                    if (Location.status != 'AUTORIZADA') {
                        if (canRequest) {
                            cordova.plugins.locationAccuracy.request(
                                function (result) {
                                    Location.getStatus();
                                    setTimeout(function () {
                                        if (!result && Location.status == 'GPS_DESATIVADO')
                                            Location.openSettings();
                                    }, 100);
                                },
                                function (error) {
                                    if (error) {
                                        if (cordova.platformId === "android" && error.code !== cordova.plugins.locationAccuracy.ERROR_USER_DISAGREED) {
                                            if (window.confirm("Falha ao definir o Modo de Localização automaticamente como 'Alta Precisão'. Deseja mudar as Configurações de local e fazer isso manualmente?"))
                                                cordova.plugins.diagnostic.switchToLocationSettings();
                                        }
                                    }
                                }, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY
                            );
                        } else if (cordova.platformId == "android" ? Location.status != 'NAO_AUTORIZADO' : true)
                            Location.openSettings();
                    }
                }, 100);
            }
        );
        setTimeout(function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        Location.checkState();
                    },
                    function () {
                        Location.checkState();
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            }
        }, 3000);
    },
    time: null,
    status: null,
    checkState: function () {
        if ("cordova" in window) {
            clearTimeout(Location.time);
            Location.time = setTimeout(function () {
                Location.getStatus(1);
            }, 1000);
        }
    },
    getStatus: function (show) {
        cordova.plugins.diagnostic.isLocationEnabled(
            function (enabled) {
                if (enabled) {
                    cordova.plugins.diagnostic.isLocationAuthorized(
                        function (authorized) {
                            Location.status = authorized ? "AUTORIZADA" : "NAO_AUTORIZADO";
                            if (show === 1) {
                                if (authorized) {
                                    if ($('div#gps:visible').length)
                                        location.reload();
                                    $('div#gps').css('display', 'none');
                                } else
                                    $('div#gps').css('display', 'flex');
                            }
                        }, function () {

                        }
                    );
                } else {
                    Location.status = 'GPS_DESATIVADO';
                    if (show === 1)
                        $('div#gps').css('display', 'flex');
                }
            },
            function () {
            }
        );
    }
};